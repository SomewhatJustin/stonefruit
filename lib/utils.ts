import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Truncates a name to a maximum of 30 characters
 * @param name - The name to truncate
 * @returns The truncated name with ellipsis if needed
 */
export function truncateName(name: string): string {
  if (name.length <= 30) {
    return name
  }
  return name.substring(0, 27) + "..."
}

/**
 * Determines the display name for a user profile based on available information.
 * Priority: name > username > email (email as fallback)
 * 
 * @param user - User object with optional name, username, and email properties
 * @returns The appropriate display name string
 */
export function getProfileDisplayName(user: {
  name?: string | null
  username?: string | null
  email?: string | null
}): string {
  // First priority: name
  if (user.name && user.name.trim()) {
    return truncateName(user.name.trim())
  }
  
  // Second priority: username
  if (user.username && user.username.trim()) {
    return truncateName(user.username.trim())
  }
  
  // Fallback: email
  if (user.email && user.email.trim()) {
    return truncateName(user.email.trim())
  }
  
  // Ultimate fallback if everything is null/empty
  return "Unknown User"
}

/**
 * Determines if a WebSocket event is relevant for the current chat context.
 * Handles both channels and DMs, using channelId for DMs.
 *
 * @param context - The current chat context (channel or dm)
 * @param data - The event data (should have kind, id, userId, etc.)
 * @param userId - The current user's ID
 * @param messages - The current message list (for DM channelId lookup)
 */
export function isEventRelevant(
  context: { kind: "channel" | "dm"; id: string },
  data: { kind: string; id: string; userId?: string },
  userId: string,
  messages: { channelId?: string; senderId?: string }[]
): boolean {
  if (context.kind === "channel") {
    return data.kind === "channel" && data.id === context.id
  } else if (context.kind === "dm") {
    // context.id is the other user's userId
    return data.kind === "dm" && data.userId === context.id
  }
  return false
}
