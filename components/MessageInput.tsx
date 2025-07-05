"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface MessageInputProps {
  onSend: (text: string) => void
  placeholder?: string
}

export default function MessageInput({
  onSend,
  placeholder,
}: MessageInputProps) {
  const [value, setValue] = useState("")

  const handleSend = () => {
    if (value.trim() === "") return
    onSend(value)
    setValue("")
  }

  return (
    <div className="flex gap-2 mt-4 justify-end">
      <Input
        type="text"
        className="border px-2 py-1 rounded"
        value={value}
        placeholder={placeholder}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => {
          if (e.key === "Enter") handleSend()
        }}
      />
      <Button onClick={handleSend} className="border px-2 py-1 rounded">
        Send
      </Button>
    </div>
  )
}
