import { initTRPC } from "@trpc/server"
import { auth } from "@/auth"
import { prisma } from "@/prisma/prisma"
import { z } from "zod"
import { EventEmitter } from "events"
import type { Channel } from "@prisma/client"
import { TRPCError } from "@trpc/server"

// Simple in-memory pubsub (shared across route workers)
const globalForEvents = globalThis as unknown as { messageBus?: EventEmitter }
const messageEvents =
  globalForEvents.messageBus ||
  (globalForEvents.messageBus = new EventEmitter())
globalForEvents.messageBus = messageEvents

// Context: attach NextAuth session
export async function createContext() {
  const session = await auth()
  return { session }
}
export type Context = Awaited<ReturnType<typeof createContext>>

// Recreate tRPC with context
const t = initTRPC.context<Context>().create()
export const router = t.router
export const publicProcedure = t.procedure
export const protectedProcedure = publicProcedure.use(
  t.middleware(({ ctx, next }) => {
    if (!ctx.session?.user) {
      throw new Error("UNAUTHORIZED")
    }
    return next({ ctx: { session: ctx.session } })
  })
)

const GENERAL_CHANNEL_ID = "general"

// Utility: get or create a 1-to-1 direct-message channel for two users
async function ensureDirectChannel(
  userA: string,
  userB: string
): Promise<Channel> {
  const directHash = [userA, userB].sort().join(":")

  // Try to find an existing DM channel
  let channel = await prisma.channel.findUnique({ where: { directHash } })

  if (!channel) {
    // Create the channel & memberships
    channel = await prisma.channel.create({
      data: {
        name: null,
        isDirect: true,
        creatorId: userA,
        directHash,
        members: {
          create: [{ userId: userA }, { userId: userB }],
        },
      },
    })
  } else {
    // Ensure both users are members (idempotent upserts)
    await prisma.channelMember.upsert({
      where: { channelId_userId: { channelId: channel.id, userId: userA } },
      update: {},
      create: { channelId: channel.id, userId: userA },
    })
    await prisma.channelMember.upsert({
      where: { channelId_userId: { channelId: channel.id, userId: userB } },
      update: {},
      create: { channelId: channel.id, userId: userB },
    })
  }

  return channel
}

// Utility: ensure general channel exists and return it
async function getGeneralChannel(userId: string) {
  // Upsert the general channel
  const channel = await prisma.channel.upsert({
    where: { id: GENERAL_CHANNEL_ID },
    update: {},
    create: {
      id: GENERAL_CHANNEL_ID,
      name: "general",
      description: "General channel for all users",
      creatorId: userId,
      isDirect: false,
    },
  })

  // Fetch all users
  const users = await prisma.user.findMany()

  // Add each user as a member of the general channel if not already
  await Promise.all(
    users.map(async user => {
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
      })
    })
  )

  return channel
}

// API Routes
export const appRouter = router({
  ping: publicProcedure.query(() => "pong"),

  listMessages: protectedProcedure
    .input(z.object({ kind: z.enum(["channel", "dm"]), id: z.string() }))
    .query(async ({ ctx, input }) => {
      if (input.kind === "channel") {
        const { session } = ctx
        const userId = session!.user!.id as string

        const channel = await prisma.channel.findUnique({
          where: { id: input.id },
        })
        if (!channel) return []

        // Check membership
        const membership = await prisma.channelMember.findUnique({
          where: {
            channelId_userId: { channelId: channel.id, userId },
          },
        })

        if (!membership) {
          throw new TRPCError({ code: "FORBIDDEN", message: "NOT_MEMBER" })
        }

        const msgs = await prisma.message.findMany({
          where: { channelId: channel.id },
          orderBy: { createdAt: "asc" },
          take: 100,
          include: { sender: true },
        })
        return msgs
      } else if (input.kind === "dm") {
        const { session } = ctx
        const currentUserId = session!.user!.id as string

        // Ensure DM channel exists between current user & `input.id`
        const channel = await ensureDirectChannel(currentUserId, input.id)

        const msgs = await prisma.message.findMany({
          where: { channelId: channel.id },
          orderBy: { createdAt: "asc" },
          take: 100,
          include: { sender: true },
        })
        return msgs
      }
    }),

  listChannels: protectedProcedure.query(async ({ ctx }) => {
    const { session } = ctx
    const userId = session!.user!.id as string
    // Ensure the default general channel exists and the user is a member
    await getGeneralChannel(userId)
    const channels = await prisma.channel.findMany({
      where: {
        isDirect: false,
        members: {
          some: {
            userId: userId,
          },
        },
      },
    })
    return channels
  }),

  listDirectMessages: protectedProcedure.query(async ({ ctx }) => {
    const { session } = ctx
    const userId = session!.user!.id as string
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
        image: true,
      },
    })
    return directMessages
  }),

  listChannelMembers: protectedProcedure
    .input(z.object({ channelId: z.string() }))
    .query(async ({ input }) => {
      const members = await prisma.channelMember.findMany({
        where: { channelId: input.channelId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              image: true,
            },
          },
        },
      })
      return members
    }),

  searchUsers: protectedProcedure
    .input(z.object({ query: z.string().min(1) }))
    .query(async ({ input }) => {
      const users = await prisma.user.findMany({
        where: {
          OR: [
            { email: { contains: input.query, mode: "insensitive" } },
            { name: { contains: input.query, mode: "insensitive" } },
            { username: { contains: input.query, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          email: true,
          name: true,
          username: true,
          image: true,
        },
        take: 10,
      })
      return users
    }),

  addChannelMember: protectedProcedure
    .input(z.object({ channelId: z.string(), userId: z.string() }))
    .mutation(async ({ input }) => {
      const cm = await prisma.channelMember.upsert({
        where: {
          channelId_userId: {
            channelId: input.channelId,
            userId: input.userId,
          },
        },
        update: {},
        create: {
          channelId: input.channelId,
          userId: input.userId,
        },
      })
      return cm
    }),

  removeChannelMember: protectedProcedure
    .input(z.object({ channelId: z.string(), userId: z.string() }))
    .mutation(async ({ input }) => {
      // Delete relation; ignore if not found
      try {
        await prisma.channelMember.delete({
          where: {
            channelId_userId: {
              channelId: input.channelId,
              userId: input.userId,
            },
          },
        })
      } catch (err) {
        // noop if not found
      }
      return true
    }),

  createChannel: protectedProcedure
    .input(z.object({ name: z.string(), description: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { session } = ctx
      const userId = session!.user!.id as string
      const channel = await prisma.channel.create({
        data: {
          name: input.name,
          description: input.description,
          creatorId: userId,
          isDirect: false,
          members: {
            create: {
              user: { connect: { id: userId } },
            },
          },
        },
      })
      return channel
    }),

  postMessage: protectedProcedure
    .input(
      z.object({
        text: z.string().min(1),
        kind: z.enum(["channel", "dm"]),
        id: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { session } = ctx
      const userId = session!.user!.id as string

      // Declare variable here so it's in scope for the entire mutation
      let msg: Awaited<ReturnType<typeof prisma.message.create>>

      if (input.kind === "channel") {
        msg = await prisma.message.create({
          data: {
            channelId: input.id,
            senderId: userId,
            content: input.text,
          },
          include: { sender: true },
        })
      } else {
        // Direct message branch – input.id is the other participant's user id
        const channel = await ensureDirectChannel(userId, input.id)

        msg = await prisma.message.create({
          data: {
            senderId: userId,
            channelId: channel.id,
            content: input.text,
          },
          include: { sender: true },
        })
      }

      // Broadcast via WebSocket
      messageEvents.emit("new", msg)
      return msg
    }),
})

export type AppRouter = typeof appRouter

// Export pubsub for WS route
export { messageEvents }
