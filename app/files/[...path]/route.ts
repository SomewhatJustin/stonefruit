import { createReadStream } from "fs"
import { stat } from "fs/promises"
import path from "path"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(
  _req: Request,
  { params }: { params: { path: string[] } }
) {
  const filePath = path.join(process.cwd(), "uploads", ...params.path)

  try {
    await stat(filePath) // ensure file exists
  } catch {
    return new Response("File not found", { status: 404 })
  }

  const stream = createReadStream(filePath)
  return new Response(stream as any, {
    headers: {
      // Fallback MIME type – browsers will sniff if needed
      "Content-Type": "application/octet-stream",
    },
  })
}
