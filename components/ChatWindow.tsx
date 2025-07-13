"use client"

import type { inferRouterOutputs } from "@trpc/server"
import type { AppRouter } from "@/trpc"
import MessageList from "./MessageList"
import MessageInput from "./MessageInput"
import { useEffect, useRef } from "react"

// Infer message shape from tRPC output
type RouterOutputs = inferRouterOutputs<AppRouter>
export type ChatMessage = NonNullable<RouterOutputs["listMessages"]>[number]

interface ChatWindowProps {
  messages: ChatMessage[]
  isLoading: boolean
  sendMessage: (text: string) => void
  sendTyping: () => void
  typingUser: string | null
  currentUserId: string
  onToggleReaction?: (messageId: string, emoji: string) => void
}

export default function ChatWindow({
  messages,
  isLoading,
  sendMessage,
  sendTyping,
  typingUser,
  currentUserId,
  onToggleReaction,
}: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to deep-linked message, or to the bottom.
  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }
    const hash = window.location.hash
    if (hash.startsWith("#msg-")) {
      const el = document.getElementById(hash.substring(1))
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" })
      }
    } else {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "auto" })
      }
    }
  }, [messages])

  return (
    <div className="flex flex-col gap-4 h-full min-h-[400px] flex-1 justify-end relative">
      <div className="flex flex-col flex-1 justify-end">
        <div className="flex-1 flex flex-col justify-end overflow-y-auto">
          <MessageList
            messages={messages}
            isLoading={isLoading}
            currentUserId={currentUserId}
            onToggleReaction={onToggleReaction}
          />
          <div ref={messagesEndRef} />
        </div>
        <div className="sticky inset-x-0 bottom-0 bg-background z-10 px-3 pb-4">
          <div>
            {typingUser && (
              <div className="text-xs text-muted-foreground mb-1">
                {typingUser} is typing…
              </div>
            )}
            <MessageInput onSend={sendMessage} onTyping={sendTyping} />
          </div>
        </div>
      </div>
    </div>
  )
}
