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
