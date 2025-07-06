"use client"

import { Download } from "lucide-react"

export default function FileCard({ url }: { url: string }) {
  const filename = url.split("/").pop() ?? "file"
  const isImage = /\.(png|jpe?g|gif|webp|svg)$/i.test(filename)

  const handleDownload = () => {
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.target = "_blank"
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  return (
    <div className="border rounded-md p-2 my-2 w-[300px] bg-accent/20 dark:bg-accent/30">
      {isImage ? (
        <img
          src={url}
          alt={filename}
          className="w-full h-auto object-cover rounded mb-2"
        />
      ) : null}
      <div className="flex items-center gap-2 text-xs break-all">
        <span className="flex-1">{filename}</span>
        <button onClick={handleDownload} className="hover:text-primary">
          <Download className="size-4" />
        </button>
      </div>
    </div>
  )
}
