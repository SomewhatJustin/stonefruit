import Resend from "next-auth/providers/resend"
import type { NextAuthConfig } from "next-auth"

// Avatar generation & DB helper
import { generateAvatar } from "@/scripts/generateAvatar"
import { prisma } from "@/prisma/prisma"

const authConfig = {
  providers: [
    Resend({
      apiKey: process.env.RESEND_API_KEY,
      from: "noreply@stonefruit.justin.how", // Update to your verified domain on Resend
    }),
  ],
  trustHost: true,
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      console.log("[auth] signIn event:", {
        email: user?.email,
        provider: account?.provider,
        isNewUser,
        time: new Date().toISOString(),
      })
    },
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore – event type inference for createUser is missing in some auth versions
    async createUser({ user }) {
      try {
        const imageUrl = await generateAvatar(user.id!)
        await prisma.user.update({
          where: { id: user.id },
          data: { image: imageUrl },
        })
        console.log("[avatar] Generated avatar for", user.email)
      } catch (err) {
        console.error("[avatar] Failed to generate avatar", err)
      }
    },
  },
} satisfies NextAuthConfig

export default authConfig
