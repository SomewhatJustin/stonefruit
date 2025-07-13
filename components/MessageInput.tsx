"use client"

import { useState, useRef } from "react"
import { Paperclip } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface MessageInputProps {
  onSend: (text: string) => void
  onTyping?: () => void
  placeholder?: string
}

export default function MessageInput({
  onSend,
  onTyping,
  placeholder,
}: MessageInputProps) {
  const [value, setValue] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSend = () => {
    if (value.trim() === "") return
    onSend(value)
    setValue("")
  }

  const handleFileClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const MAX_SIZE = 25 * 1024 * 1024 // 25 MB

    if (file.size > MAX_SIZE) {
      toast.error("File is larger than 25 MB — choose a smaller file.")
      e.target.value = ""
      return
    }

    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        let msg = "Upload failed"
        try {
          const data = await res.json()
          msg = data.error ?? msg
        } catch {}
        toast.error(msg)
        return
      }
      const data = (await res.json()) as { urls?: string[] }
      const url = data.urls?.[0]
      if (url) {
        toast.success("File uploaded")
        console.log("Uploaded file path:", url)
        onSend(url)
      }
    } catch (err) {
      console.error(err)
      toast.error("Upload failed. Check console for details.")
    } finally {
      // allow re-selecting the same file later
      e.target.value = ""
    }
  }

  return (
    <div className="flex gap-2 mt-4 justify-end items-center">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Paperclip icon button */}
      <Button
        type="button"
        size="icon"
        variant="ghost"
        onClick={handleFileClick}
      >
        <Paperclip className="size-5" />
      </Button>
      <Input
        type="text"
        className="border px-2 py-1 rounded"
        value={value}
        placeholder={placeholder}
        onChange={e => {
          setValue(e.target.value)
          onTyping?.()
        }}
        onKeyDown={e => {
          if (e.key === "Enter") handleSend()
        }}
      />
      <Button 
        onClick={handleSend} 
        className="bg-gradient-to-br from-pink-400 via-pink-500 via-purple-500 via-indigo-500 to-indigo-400 hover:from-pink-500 hover:via-pink-600 hover:via-purple-600 hover:via-indigo-600 hover:to-indigo-500 text-white font-bold py-2 px-6 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 hover:animate-none"
      >
        Send
      </Button>
    </div>
  )
}
