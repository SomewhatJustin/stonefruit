# Local File Uploads – MVP Draft

> Quick and dirty guide for adding **local-disk uploads** to Stonefruit until we swap to Cloudflare R2/MinIO.

---

## 1. Folder layout

```
stonefruit/
├─ uploads/            # <─ NEW: raw files live here (git-ignored)
├─ app/
│  └─ api/
│     ├─ upload/route.ts    # POST multipart → disk
│     └─ files/[...path]/route.ts  # GET stream <file>
└─ ...
```

- Add `uploads/` to `.gitignore` so nothing gets committed.
- For production you'll typically mount a Docker volume at an **absolute path** (e.g. `/var/data/stonefruit/uploads`).  
  Keeping uploads outside the application bundle means redeploys or container restarts never wipe user files.

---

## 2. Install helpers

```bash
pnpm add formidable   # robust multipart parser
```

(If you prefer `busboy` or `multer`, swap it in.)

---

## 3. POST `/api/upload` handler

**Goal:** accept one or more files and return JSON with their future download URLs.

Pseudo-code:

```ts
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import { IncomingForm } from "formidable"
import { nanoid } from "nanoid"

export const POST = async (req: Request) => {
  const form = await new Promise<FormidableFiles>((resolve, reject) => {
    const form = new IncomingForm({ maxFileSize: 25 * 1024 * 1024 }) // 25 MB limit
    form.parse(req, (err, _fields, files) =>
      err ? reject(err) : resolve(files)
    )
  })

  const out: string[] = []
  await mkdir("uploads", { recursive: true })

  for (const file of Object.values(form)) {
    const id = nanoid()
    const filename = `${id}-${file.originalFilename}`
    await writeFile(
      path.join("uploads", filename),
      await fs.readFile(file.filepath)
    )
    out.push(`/files/${filename}`)
  }

  return Response.json({ urls: out })
}
```

Important bits:

- `await mkdir("uploads", { recursive: true })` – makes sure folder exists.
- Prefix each file with a `nanoid()` to avoid collisions.
- No DB write yet—return URL to client who can store it.

---

## 4. GET `/files/[...path]` handler

Streams the raw file from disk so it's served under the same domain (avoids CORS headaches):

```ts
import { createReadStream } from "fs"
import path from "path"

export const GET = async (
  _req: Request,
  { params }: { params: { path: string[] } }
) => {
  const filePath = path.join(process.cwd(), "uploads", ...params.path)
  const stream = createReadStream(filePath)
  return new Response(stream as any, {
    headers: { "Content-Type": "application/octet-stream" },
  })
}
```

Add minimal MIME-type detection if you like.

---

## 5. Front-end usage

```ts
const data = new FormData()
for (const f of files) data.append("file", f)
await fetch("/api/upload", { method: "POST", body: data })
```

Returned JSON gives you `/files/<id>-name.ext` which you store in your message record.

---

## 6. Security considerations

1. **Size limit** – set `maxFileSize` in `formidable` (e.g. 25 MB).
2. **Type checking** – whitelist MIME types if needed.
3. **User auth** – wrap both upload & download routes with auth checks if the channel/DM is private.
4. **Cleanup** – nightly cron to prune orphaned files.

---

## 7. Migration path

1. Swap the `uploads/` path to presigned URLs on Cloudflare R2 (or another CDN-backed object store).
2. Keep the same front-end API – zero UI changes.
3. Update download URLs to point to the bucket's CDN.

---

### 👍 Ready for review – feel free to comment inline or suggest tweaks.
