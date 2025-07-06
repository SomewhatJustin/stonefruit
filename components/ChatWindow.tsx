"use client"

import type { inferRouterOutputs } from "@trpc/server"
import type { AppRouter } from "@/trpc"
import MessageList from "./MessageList"
import MessageInput from "./MessageInput"

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
}

export default function ChatWindow({
  messages,
  isLoading,
  sendMessage,
  sendTyping,
  typingUser,
  currentUserId,
}: ChatWindowProps) {
  return (
    <div className="flex flex-col gap-4 h-full min-h-[400px] flex-1 justify-end relative">
      <div className="flex flex-col flex-1 justify-end">
        <div className="flex-1 flex flex-col justify-end overflow-y-auto">
          <MessageList
            messages={messages}
            isLoading={isLoading}
            currentUserId={currentUserId}
          />
        </div>
        <div className="absolute inset-x-0 bottom-0 bg-background z-10  px-4">
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
