import { handlers } from "@/auth";
import type { NextRequest } from "next/server";

function isPrefetch(req: NextRequest) {
  const purpose = req.headers.get("purpose") ?? req.headers.get("sec-purpose");
  if (purpose?.includes("prefetch")) return true;
  if (req.headers.get("x-middleware-prefetch") === "1") return true;   // Next.js router
  return false;
}

/** Gmail/Chrome HEAD probe */
export function HEAD(req: NextRequest) {
  for (const [key, value] of req.headers.entries()) {
  }
  return new Response(null, { status: 200 });
}

/** Real log-in vs Google prefetch */
export async function GET(req: NextRequest) {
  for (const [key, value] of req.headers.entries()) {
  }
  if (isPrefetch(req)) {
    // let Gmail / Chrome see a 200 OK but keep the token intact
    return new Response(null, { status: 204 });
  }
  return handlers.GET(req);        // falls through to AuthJS
}

export const { POST } = handlers;  // unchanged
export const runtime = "nodejs";
