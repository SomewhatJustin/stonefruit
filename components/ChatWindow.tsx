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
  currentUserId: string
}

export default function ChatWindow({
  messages,
  isLoading,
  sendMessage,
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
        <div className="fixed bottom-0 right-0 left-[var(--sidebar-width,16rem)] bg-background z-10 pb-4 px-4">
          <div className="max-w-3xl mx-auto">
            <MessageInput onSend={sendMessage} />
          </div>
        </div>
        <div className="h-24" />
      </div>
    </div>
  )
}
