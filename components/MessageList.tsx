"use client"

import type { ChatMessage } from "./ChatWindow"
import FileCard from "./FileCard"

interface MessageListProps {
  messages: ChatMessage[]
  isLoading?: boolean
  currentUserId?: string
}

export default function MessageList({
  messages,
  isLoading,
  currentUserId,
}: MessageListProps) {
  return (
    <>
      {messages.length > 0 ? (
        <ul className="my-16 list-inside text-sm space-y-2">
          {isLoading && <div>Loading…</div>}
          {messages.map(m => (
            <li key={m.id} className="flex items-start gap-2">
              <img
                src={m.sender?.image ?? "/avatars/default.png"}
                alt={m.sender?.email ?? "avatar"}
                className="w-6 h-6 rounded-full flex-shrink-0"
              />
              <div>
                <span className="font-mono text-[10px] text-gray-500 mr-2 inline-block min-w-[60px]">
                  {new Date(m.createdAt).toLocaleTimeString()}
                </span>
                <span className="font-semibold mr-1">
                  {m.sender?.email ?? "anon"}
                </span>
                {m.content.startsWith("/files/") ? (
                  <FileCard url={m.content} />
                ) : (
                  <span>{m.content}</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-1 items-center justify-center text-center text-sm text-muted-foreground">
          No messages yet
        </div>
      )}
    </>
  )
}
