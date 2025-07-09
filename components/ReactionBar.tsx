"use client"

import { useState } from "react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface Reaction {
  count: number
  userIds: string[]
}

interface ReactionBarProps {
  reactions: Record<string, Reaction>
  currentUserId: string
  onToggleReaction: (emoji: string) => void
  getUserName?: (userId: string) => string
}

export function ReactionBar({
  reactions,
  currentUserId,
  onToggleReaction,
  getUserName = (userId: string) => `User ${userId.slice(0, 8)}`,
}: ReactionBarProps) {
  const [hoveredEmoji, setHoveredEmoji] = useState<string | null>(null)

  if (!reactions || Object.keys(reactions).length === 0) {
    return null
  }

  return (
    <TooltipProvider>
      <div className="flex flex-wrap gap-1 mt-2">
        {Object.entries(reactions).map(([emoji, reaction]) => {
          const reactedByMe = reaction.userIds.includes(currentUserId)

          return (
            <Tooltip key={emoji}>
              <TooltipTrigger asChild>
                <button
                  className={`
                    inline-flex items-center gap-1 px-2 py-1 text-sm rounded-full
                    transition-colors cursor-pointer
                    ${
                      reactedByMe
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "bg-secondary/70 hover:bg-secondary"
                    }
                  `}
                  onClick={() => onToggleReaction(emoji)}
                  onMouseEnter={() => setHoveredEmoji(emoji)}
                  onMouseLeave={() => setHoveredEmoji(null)}
                >
                  <span className="text-base">{emoji}</span>
                  <span className="text-xs font-medium">{reaction.count}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-sm">
                  <div className="font-medium mb-1">
                    {emoji} {reaction.count} reaction
                    {reaction.count !== 1 ? "s" : ""}
                  </div>
                  <div className="text-muted-foreground">
                    {reaction.userIds
                      .map(userId => getUserName(userId))
                      .join(", ")}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          )
        })}
      </div>
    </TooltipProvider>
  )
}
