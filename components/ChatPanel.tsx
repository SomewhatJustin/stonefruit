"use client"

import ChatWindow from "./ChatWindow"
import { useChat, ChatContext } from "@/hooks/useChat"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useEffect, useRef } from "react"

export default function ChatPanel({
  context,
  userId,
}: {
  context: ChatContext
  userId: string
}) {
  const {
    messages,
    isLoading,
    sendMessage,
    sendTyping,
    typingUser,
    toggleReaction,
    markRead,
    error,
  } = useChat(context, userId)
  const router = useRouter()
  const hasMarkedRead = useRef(false)

  // Mark channel as read when loading finishes
  useEffect(() => {
    if (!isLoading && !hasMarkedRead.current) {
      if (context.kind === "channel") {
        // For channels, we have the channelId directly
        markRead(context.id)
        hasMarkedRead.current = true
      } else if (messages.length > 0) {
        // For DMs, get channelId from the first message
        const channelId = messages[0]?.channelId
        if (channelId) {
          markRead(channelId)
          hasMarkedRead.current = true
        }
      }
    }
  }, [isLoading, context.kind, context.id, markRead, messages])

  // Reset the hasMarkedRead flag when context changes
  useEffect(() => {
    hasMarkedRead.current = false
  }, [context.id, context.kind])

  if (error?.data?.code === "FORBIDDEN") {
    return (
      <Dialog open>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>You can&apos;t sit with us....</DialogTitle>
            <DialogDescription>
              You do not have access to this channel.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => router.replace("/channels/general")}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  // Get channelId for ChatWindow
  const channelId = context.kind === "channel" 
    ? context.id 
    : messages.length > 0 
      ? messages[0]?.channelId 
      : undefined

  return (
    <ChatWindow
      messages={messages}
      isLoading={isLoading}
      sendMessage={sendMessage}
      sendTyping={sendTyping}
      typingUser={typingUser}
      currentUserId={userId}
      onToggleReaction={toggleReaction}
      channelId={channelId}
    />
  )
}
