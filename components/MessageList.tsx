"use client"

import { useState, useRef } from "react"
import type { ChatMessage } from "./ChatWindow"
import FileCard from "./FileCard"
import { ReactionBar } from "./ReactionBar"
import { SmilePlus } from "lucide-react"
import EmojiPicker from "./EmojiPicker"
import { getProfileDisplayName } from "@/lib/utils"

interface MessageListProps {
  messages: ChatMessage[]
  isLoading?: boolean
  currentUserId?: string
  onToggleReaction?: (messageId: string, emoji: string) => void
}

export default function MessageList({
  messages,
  isLoading,
  currentUserId,
  onToggleReaction,
}: MessageListProps) {
  const [openPickerMessageId, setOpenPickerMessageId] = useState<string | null>(
    null
  )
  const triggerRefs = useRef<Record<string, HTMLButtonElement>>({})

  const handleEmojiSelect = (messageId: string, emoji: string) => {
    if (onToggleReaction) {
      onToggleReaction(messageId, emoji)
    }
  }

  return (
    <>
      {messages.length > 0 ? (
        <ul className="my-2 list-inside text-sm space-y-2">
          {isLoading && <div>Loading…</div>}
          {messages.map(m => (
            <li
              key={m.id}
              id={`msg-${m.id}`}
              className="flex items-start gap-2 hover:bg-muted/40 transition-colors group relative"
            >
              <img
                src={m.sender?.image ?? "/avatars/default.png"}
                alt={m.sender ? getProfileDisplayName(m.sender) : "avatar"}
                className="w-6 h-6 rounded-full flex-shrink-0"
              />
              <div className="flex-1">
                <span className="font-mono text-[10px] text-gray-500 mr-2 inline-block min-w-[60px]">
                  {new Date(m.createdAt).toLocaleTimeString()}
                </span>
                <span className="font-semibold mr-1">
                  {m.sender ? getProfileDisplayName(m.sender) : "anon"}
                </span>
                {m.content.startsWith("/files/") ? (
                  <FileCard url={m.content} />
                ) : (
                  <span>{m.content}</span>
                )}
                {currentUserId && onToggleReaction && (
                  <ReactionBar
                    reactions={(() => {
                      // Handle both array format (from initial load) and object format (from WebSocket updates)
                      const reactionsData = m.reactions || []

                      // If it's already in the grouped format (from WebSocket), return as-is
                      if (
                        reactionsData &&
                        typeof reactionsData === "object" &&
                        !Array.isArray(reactionsData)
                      ) {
                        return reactionsData as Record<
                          string,
                          { count: number; userIds: string[] }
                        >
                      }

                      // Transform array of reactions to grouped format
                      const reactionsArray = Array.isArray(reactionsData)
                        ? reactionsData
                        : []
                      const grouped: Record<
                        string,
                        { count: number; userIds: string[] }
                      > = {}

                      for (const reaction of reactionsArray) {
                        if (!grouped[reaction.emoji]) {
                          grouped[reaction.emoji] = { count: 0, userIds: [] }
                        }
                        grouped[reaction.emoji].count++
                        grouped[reaction.emoji].userIds.push(reaction.userId)
                      }

                      return grouped
                    })()}
                    currentUserId={currentUserId}
                    onToggleReaction={emoji => onToggleReaction(m.id, emoji)}
                    getUserName={userId => {
                      const user = messages.find(
                        msg => msg.sender?.id === userId
                      )?.sender
                      return user ? getProfileDisplayName(user) : `User ${userId.slice(0, 8)}`
                    }}
                  />
                )}
              </div>
              {currentUserId && (
                <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                  <div className="relative">
                    <button
                      ref={el => {
                        if (el) triggerRefs.current[m.id] = el
                      }}
                      className="w-4 h-4 text-muted-foreground hover:text-foreground cursor-pointer"
                      onClick={() =>
                        setOpenPickerMessageId(
                          openPickerMessageId === m.id ? null : m.id
                        )
                      }
                    >
                      <SmilePlus className="w-4 h-4" />
                    </button>
                    {openPickerMessageId === m.id && (
                      <EmojiPicker
                        isOpen={true}
                        onClose={() => setOpenPickerMessageId(null)}
                        onEmojiSelect={emoji => handleEmojiSelect(m.id, emoji)}
                        triggerRef={{ current: triggerRefs.current[m.id] }}
                      />
                    )}
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : isLoading ? (
        <div className="flex flex-1 items-center justify-center text-center text-sm text-muted-foreground">
          Loading…
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center text-center text-sm text-muted-foreground">
          No messages yet
        </div>
      )}
    </>
  )
}
