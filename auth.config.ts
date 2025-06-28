import Mailgun from "next-auth/providers/mailgun"
import type { NextAuthConfig } from "next-auth"

const authConfig = {
  providers: [
    Mailgun({
      apiKey: process.env.AUTH_MAILGUN_KEY,
      from: "postmaster@sandboxeb2f07c0ca294a2ca596ce73976c2fbb.mailgun.org",
    }),
  ],
  trustHost: true,
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      console.log('[auth] signIn event:', {
        email: user?.email,
        provider: account?.provider,
        isNewUser,
        time: new Date().toISOString(),
      })
    },
  },
} satisfies NextAuthConfig

export default authConfig 