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
          include: { sender: true, reactions: true },
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
          include: { sender: true, reactions: true },
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

  listAllChannels: protectedProcedure.query(async ({ ctx }) => {
    const { session } = ctx
    const userId = session!.user!.id as string
    
    // Get all public channels with member status for current user
    const channels = await prisma.channel.findMany({
      where: {
        isDirect: false,
      },
      include: {
        members: {
          where: {
            userId: userId,
          },
          select: {
            userId: true,
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })
    
    return channels.map(channel => ({
      id: channel.id,
      name: channel.name,
      description: channel.description,
      memberCount: channel._count.members,
      isMember: channel.members.length > 0,
    }))
  }),

  listDirectMessages: protectedProcedure.query(async ({ ctx }) => {
    const { session } = ctx
    const userId = session!.user!.id as string

    // Get all users except current user
    const users = await prisma.user.findMany({
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

    // For each user, find or create the DM channel and include the channelId
    const directMessages = await Promise.all(
      users.map(async user => {
        const directHash = [userId, user.id].sort().join(":")

        // Try to find existing DM channel
        const channel = await prisma.channel.findUnique({
          where: { directHash },
          select: { id: true },
        })

        // If no channel exists, we'll return null channelId (channel will be created when first message is sent)
        return {
          id: user.id,
          name: user.name,
          username: user.username,
          email: user.email,
          image: user.image,
          channelId: channel?.id || null,
        }
      })
    )

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
      } catch {
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
          // Include whether the channel is a direct message so the client can distinguish
          include: {
            sender: true,
            channel: {
              select: {
                isDirect: true,
              },
            },
          },
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
          include: {
            sender: true,
            channel: {
              select: {
                isDirect: true,
              },
            },
          },
        })
      }

      // Broadcast via WebSocket
      messageEvents.emit("new", msg)
      return msg
    }),

  // NEW: send typing indicator (no DB write)
  sendTyping: protectedProcedure
    .input(
      z.object({
        kind: z.enum(["channel", "dm"]),
        id: z.string(),
      })
    )
    .mutation(({ ctx, input }) => {
      const { session } = ctx
      const userId = session!.user!.id as string
      messageEvents.emit("typing", {
        type: "typing",
        userId,
        name: session!.user?.name ?? session!.user?.email ?? "Someone",
        kind: input.kind,
        id: input.id,
      })
      return true
    }),

  searchMessages: protectedProcedure
    .input(z.object({ query: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const { session } = ctx
      const userId = session!.user!.id as string

      // Fetch up to 20 recent messages that contain the query (case-insensitive)
      // and belong to channels where the current user is a member.
      const messages = await prisma.message.findMany({
        where: {
          content: {
            contains: input.query,
            mode: "insensitive",
          },
          channel: {
            members: {
              some: { userId },
            },
          },
        },
        include: {
          channel: {
            select: {
              id: true,
              name: true,
              isDirect: true,
              members: {
                select: {
                  userId: true,
                },
              },
            },
          },
          sender: {
            select: {
              id: true,
              email: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      })

      // Map to lightweight result objects for UI consumption
      return messages.map(m => {
        // Determine DM partner user id when channel is direct
        let dmUserId: string | null = null
        if (m.channel.isDirect) {
          const otherMember = m.channel.members.find(
            mem => mem.userId !== userId
          )
          dmUserId = otherMember?.userId ?? null
        }

        return {
          id: m.id,
          channelId: m.channelId,
          channelName: m.channel.name ?? "Direct Message",
          isDirect: m.channel.isDirect,
          dmUserId,
          content: m.content,
          createdAt: m.createdAt,
        }
      })
    }),

  reactionToggle: protectedProcedure
    .input(z.object({ messageId: z.string(), emoji: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { session } = ctx
      const userId = session!.user!.id as string
      const { messageId, emoji } = input

      // Check for existing reaction
      const existing = await prisma.reaction.findUnique({
        where: {
          messageId_userId_emoji: {
            messageId,
            userId,
            emoji,
          },
        },
      })

      if (existing) {
        await prisma.reaction.delete({
          where: {
            messageId_userId_emoji: {
              messageId,
              userId,
              emoji,
            },
          },
        })
      } else {
        await prisma.reaction.create({
          data: {
            messageId,
            userId,
            emoji,
          },
        })
      }

      // Return aggregated counts for the message
      const reactions = await prisma.reaction.findMany({
        where: { messageId },
        select: { emoji: true, userId: true },
      })
      // Group by emoji
      const grouped: Record<string, { count: number; userIds: string[] }> = {}
      for (const r of reactions) {
        if (!grouped[r.emoji]) grouped[r.emoji] = { count: 0, userIds: [] }
        grouped[r.emoji].count++
        grouped[r.emoji].userIds.push(r.userId)
      }

      // Fetch channelId for this message
      const msg = await prisma.message.findUnique({
        where: { id: messageId },
        select: { channelId: true },
      })
      if (msg) {
        messageEvents.emit("reaction", {
          type: "reaction",
          channelId: msg.channelId,
          messageId,
          reactions: grouped,
        })
      }
      return grouped
    }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().optional(),
        username: z.string().optional(),
        image: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { session } = ctx
      const userId = session!.user!.id as string

      // Check if username is already taken (if provided)
      if (input.username) {
        const existing = await prisma.user.findUnique({
          where: { username: input.username },
        })
        if (existing && existing.id !== userId) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Username is already taken",
          })
        }
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          ...(input.name !== undefined && { name: input.name }),
          ...(input.username !== undefined && { username: input.username }),
          ...(input.image !== undefined && { image: input.image }),
        },
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          image: true,
        },
      })

      return updatedUser
    }),

  read: router({
    mark: protectedProcedure
      .input(z.object({ channelId: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const { session } = ctx
        const userId = session!.user!.id as string

        await prisma.channelRead.upsert({
          where: {
            channelId_userId: {
              channelId: input.channelId,
              userId: userId,
            },
          },
          update: {
            lastRead: new Date(),
          },
          create: {
            channelId: input.channelId,
            userId: userId,
            lastRead: new Date(),
          },
        })

        return true
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      const { session } = ctx
      const userId = session!.user!.id as string

      // More efficient query: find all channels with unread messages in one go
      const unreadChannels = await prisma.$queryRaw<{ channelId: string }[]>`
        SELECT DISTINCT c.id as "channelId"
        FROM "Channel" c
        INNER JOIN "ChannelMember" cm ON cm."channelId" = c.id
        INNER JOIN "Message" m ON m."channelId" = c.id
        LEFT JOIN "ChannelRead" cr ON cr."channelId" = c.id AND cr."userId" = ${userId}
        WHERE cm."userId" = ${userId}
          AND m."senderId" != ${userId}
          AND m."createdAt" > COALESCE(cr."lastRead", '1970-01-01'::timestamp)
      `

      return unreadChannels.map(row => row.channelId)
    }),
  }),
})

export type AppRouter = typeof appRouter

// Export pubsub for WS route
export { messageEvents }
