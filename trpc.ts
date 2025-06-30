import { initTRPC } from "@trpc/server";
import { auth } from "@/auth";
import { prisma } from "@/prisma/prisma";
import { z } from "zod";
import { EventEmitter } from "events";

// Simple in-memory pubsub (shared across route workers)
const globalForEvents = globalThis as unknown as { messageBus?: EventEmitter };
const messageEvents =
  globalForEvents.messageBus ||
  (globalForEvents.messageBus = new EventEmitter());
globalForEvents.messageBus = messageEvents;

// Context: attach NextAuth session
export async function createContext() {
  const session = await auth();
  return { session };
}
export type Context = Awaited<ReturnType<typeof createContext>>;

// Recreate tRPC with context
const t = initTRPC.context<Context>().create();
export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = publicProcedure.use(
  t.middleware(({ ctx, next }) => {
    if (!ctx.session?.user) {
      throw new Error("UNAUTHORIZED");
    }
    return next({ ctx: { session: ctx.session } });
  }),
);

const GENERAL_CHANNEL_ID = "general";

// Utility: ensure general channel exists and return it
async function getGeneralChannel(userId: string) {
  // Upsert the general channel
  const channel = await prisma.channel.upsert({
    where: { id: GENERAL_CHANNEL_ID },
    update: {},
    create: {
      id: GENERAL_CHANNEL_ID,
      name: "general",
      creatorId: userId,
      isDirect: false,
    },
  });

  // Fetch all users
  const users = await prisma.user.findMany();

  // Add each user as a member of the general channel if not already
  await Promise.all(
    users.map(async (user) => {
      await prisma.channelMember.upsert({
        where: {
          channelId_userId: {
            channelId: GENERAL_CHANNEL_ID,
            userId: user.id,
          },
        },
        update: {},
        create: {
          channelId: GENERAL_CHANNEL_ID,
          userId: user.id,
        },
      });
    }),
  );

  return channel;
}

export const appRouter = router({
  ping: publicProcedure.query(() => "pong"),

  listMessages: protectedProcedure.query(async ({ ctx }) => {
    const channel = await prisma.channel.findUnique({
      where: { id: GENERAL_CHANNEL_ID },
    });
    if (!channel) return [];
    const msgs = await prisma.message.findMany({
      where: { channelId: channel.id },
      orderBy: { createdAt: "asc" },
      take: 100,
      include: { sender: true },
    });
    return msgs;
  }),

  listChannels: protectedProcedure.query(async ({ ctx }) => {
    const { session } = ctx;
    const userId = session!.user!.id as string;
    const channels = await prisma.channel.findMany({
      where: {
        members: {
          some: {
            userId: userId,
          },
        },
      },
    });
    return channels;
  }),

  listDirectMessages: protectedProcedure.query(async ({ ctx }) => {
    const { session } = ctx;
    const userId = session!.user!.id as string;
    const directMessages = await prisma.user.findMany({
      where: {
        id: {
          not: userId,
        },
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
      },
    });
    return directMessages;
  }),

  postMessage: protectedProcedure
    .input(z.object({ text: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      const { session } = ctx;
      const userId = session!.user!.id as string;
      // Ensure channel exists
      const channel = await getGeneralChannel(userId);
      const msg = await prisma.message.create({
        data: {
          channelId: channel.id,
          senderId: userId,
          content: input.text,
        },
        include: { sender: true },
      });
      // Emit event
      messageEvents.emit("new", msg);
      return msg;
    }),
});

export type AppRouter = typeof appRouter;

// Export pubsub for WS route
export { messageEvents };
