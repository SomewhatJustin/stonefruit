import { NextRequest } from "next/server"
import { fetchRequestHandler } from "@trpc/server/adapters/fetch"
import { appRouter } from "@/trpc"
import { createContext } from "@/trpc"

// Forward requests to the App Router in trpc.ts
const handler = (req: NextRequest) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext,
  })

export { handler as GET, handler as POST }
