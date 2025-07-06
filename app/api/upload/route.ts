import { mkdir, writeFile, stat } from "fs/promises"
import path from "path"

export const runtime = "nodejs" // use Node runtime so we can access the filesystem
export const dynamic = "force-dynamic" // disable route caching

// POST /api/upload
export async function POST(req: Request) {
  try {
    // Parse multipart form-data using built-in Request.formData()
    const formData = await req.formData()
    const files = formData.getAll("file") as File[]

    if (files.length === 0) {
      return new Response(
        JSON.stringify({ error: "No files found in request" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    await mkdir("uploads", { recursive: true })

    const urls: string[] = []

    for (const file of files) {
      // Enforce 25 MB limit per file
      const MAX_SIZE = 25 * 1024 * 1024 // 25 MB
      if (file.size > MAX_SIZE) {
        return new Response(
          JSON.stringify({ error: "File exceeds 25 MB limit" }),
          {
            status: 413,
            headers: { "Content-Type": "application/json" },
          }
        )
      }

      // Sanitize filename and ensure uniqueness by checking existing files
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
      const ext = path.extname(safeName)
      const base = path.basename(safeName, ext)
      let candidate = safeName
      let counter = 1

      while (true) {
        try {
          await stat(path.join(process.cwd(), "uploads", candidate))
          // File exists; generate new candidate
          candidate = `${base}-${counter}${ext}`
          counter++
        } catch {
          // File does not exist
          break
        }
      }

      const filename = candidate
      const buffer = Buffer.from(await file.arrayBuffer())
      await writeFile(path.join(process.cwd(), "uploads", filename), buffer)
      urls.push(`/files/${filename}`)
    }

    return new Response(JSON.stringify({ urls }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: "Upload failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
