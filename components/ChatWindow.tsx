"use client"

import type { inferRouterOutputs } from "@trpc/server"
import type { AppRouter } from "@/trpc"
import MessageList from "./MessageList"
import MessageInput from "./MessageInput"
import { useEffect, useRef } from "react"
import { trpc } from "@/lib/trpcClient"

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
  channelId?: string // Add channelId to fetch lastRead timestamp
}

export default function ChatWindow({
  messages,
  isLoading,
  sendMessage,
  sendTyping,
  typingUser,
  currentUserId,
  onToggleReaction,
  channelId,
}: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Fetch the user's last read timestamp for this channel
  const { data: lastReadTimestamp } = trpc.read.getLastRead.useQuery(
    { channelId: channelId || "" },
    { enabled: !!channelId }
  )

  // Scroll to deep-linked message, first unread message, or to the bottom.
  useEffect(() => {
    if (typeof window === "undefined" || isLoading || messages.length === 0) {
      return
    }

    const hash = window.location.hash
    if (hash.startsWith("#msg-")) {
      // Priority 1: Deep-linked message
      const el = document.getElementById(hash.substring(1))
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" })
        return
      }
    }

    // Priority 2: First unread message (if we have lastReadTimestamp)
    if (lastReadTimestamp && channelId) {
      const firstUnreadMessage = messages.find(
        message => new Date(message.createdAt) > new Date(lastReadTimestamp)
      )
      
      if (firstUnreadMessage) {
        const unreadEl = document.getElementById(`msg-${firstUnreadMessage.id}`)
        if (unreadEl) {
          unreadEl.scrollIntoView({ behavior: "smooth", block: "start" })
          return
        }
      }
    }

    // Priority 3: Scroll to bottom (default)
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "auto" })
    }
  }, [messages, lastReadTimestamp, isLoading, channelId])

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
