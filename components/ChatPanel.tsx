"use client";

import ChatWindow from "./ChatWindow";
import { useChat, ChatContext } from "@/hooks/useChat";

export default function ChatPanel({
  context,
  userId,
}: {
  context: ChatContext;
  userId: string;
}) {
  const { messages, isLoading, sendMessage } = useChat(context, userId);

  return (
    <ChatWindow
      messages={messages}
      isLoading={isLoading}
      sendMessage={sendMessage}
    />
  );
}
