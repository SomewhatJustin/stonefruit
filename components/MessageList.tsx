"use client";

import type { ChatMessage } from "./ChatWindow";

interface MessageListProps {
  messages: ChatMessage[];
  isLoading?: boolean;
}

export default function MessageList({ messages, isLoading }: MessageListProps) {
  return (
    <ul className="mt-2 list-inside text-sm">
      {isLoading && <div>Loading…</div>}
      {messages.map((m) => (
        <li key={m.id}>
          <span className="font-mono text-xs text-gray-500 w-32 inline-block">
            {new Date(m.createdAt).toLocaleTimeString()}
          </span>{" "}
          {m.sender?.email ?? "anon"}: {m.content}
        </li>
      ))}
    </ul>
  );
} 