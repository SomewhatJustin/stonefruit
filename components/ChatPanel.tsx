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
    error,
  } = useChat(context, userId)
  const router = useRouter()

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

  return (
    <ChatWindow
      messages={messages}
      isLoading={isLoading}
      sendMessage={sendMessage}
      sendTyping={sendTyping}
      typingUser={typingUser}
      currentUserId={userId}
      onToggleReaction={toggleReaction}
    />
  )
}
