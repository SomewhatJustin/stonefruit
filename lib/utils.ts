import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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
    return user.name.trim()
  }
  
  // Second priority: username
  if (user.username && user.username.trim()) {
    return user.username.trim()
  }
  
  // Fallback: email
  if (user.email && user.email.trim()) {
    return user.email.trim()
  }
  
  // Ultimate fallback if everything is null/empty
  return "Unknown User"
}
