import { createReadStream } from "fs"
import { stat } from "fs/promises"
import path from "path"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Fix the type signature for the GET handler to match Next.js expectations
export async function GET(
  req: Request,
  context: { params: Promise<{ path?: string[] }> }
) {
  const params = await context.params
  const paramsPath = params?.path
  if (!paramsPath || !Array.isArray(paramsPath) || paramsPath.length === 0) {
    return new Response("Missing file path", { status: 400 })
  }

  const filePath = path.join(process.cwd(), "uploads", ...paramsPath)

  try {
    await stat(filePath) // ensure file exists
  } catch {
    return new Response("File not found", { status: 404 })
  }

  const stream = createReadStream(filePath)
  return new Response(stream as any, {
    headers: {
      "Content-Type": "application/octet-stream",
    },
  })
}
