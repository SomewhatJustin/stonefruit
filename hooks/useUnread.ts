"use client"

import { useEffect, useState, useMemo } from "react"
import { usePathname } from "next/navigation"
import { trpc } from "@/lib/trpcClient"

export function useUnread(userId?: string) {
  const pathname = usePathname()
  const utils = trpc.useUtils()
  const [localUnreadSet, setLocalUnreadSet] = useState<Set<string>>(new Set())

  // Fetch unread channels from server
  const { data: unreadChannelIds = [] } = trpc.read.list.useQuery()

  // Memoize the unread set to prevent unnecessary re-renders
  const serverUnreadSet = useMemo(
    () => new Set(unreadChannelIds),
    [unreadChannelIds.join(",")]
  )

  // Update local unread set when server data changes
  useEffect(() => {
    setLocalUnreadSet(serverUnreadSet)
  }, [serverUnreadSet])

  // WebSocket listener for real-time unread updates
  useEffect(() => {
    const wsUrl =
      process.env.NEXT_PUBLIC_WS_URL ||
      (window.location.protocol === "https:"
        ? `wss://${window.location.host}/ws`
        : `ws://${window.location.hostname}:${
            process.env.NEXT_PUBLIC_WS_PORT || 3001
          }`)

    const globalForWs = window as unknown as { __chatWs?: WebSocket }
    if (!globalForWs.__chatWs || globalForWs.__chatWs.readyState === 3) {
      globalForWs.__chatWs = new WebSocket(wsUrl)
    }

    const ws = globalForWs.__chatWs

    const handleMessage = (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data)

        // Check if this is a new message event (has channelId and senderId)
        if (data.channelId && data.senderId) {
          // Don't mark as unread if the current user sent the message
          if (userId && data.senderId === userId) {
            return
          }

          // Check if we're currently viewing this channel
          const isCurrentlyViewing =
            pathname?.includes(data.channelId) ||
            (pathname?.startsWith("/channels/") &&
              pathname.split("/channels/")[1] === data.channelId) ||
            (pathname?.startsWith("/dm/") && pathname.includes(data.channelId))

          if (!isCurrentlyViewing) {
            // Add to unread set
            setLocalUnreadSet(prev => new Set([...prev, data.channelId]))
          }
        }
      } catch (err) {
        // ignore invalid JSON
      }
    }

    ws.addEventListener("message", handleMessage)

    return () => {
      ws.removeEventListener("message", handleMessage)
    }
  }, [pathname])

  // Clear unread when navigating to a channel (DM clearing happens via markRead in ChatPanel)
  useEffect(() => {
    if (pathname?.startsWith("/channels/")) {
      const channelId = pathname.split("/channels/")[1]
      if (channelId) {
        setLocalUnreadSet(prev => {
          const newSet = new Set(prev)
          newSet.delete(channelId)
          return newSet
        })
      }
    }
  }, [pathname])

  // Mark channel as read function
  const markReadMutation = trpc.read.mark.useMutation({
    onSuccess: () => {
      // Invalidate the unread list to update the UI
      utils.read.list.invalidate()
    },
  })

  const markRead = (channelId: string) => {
    // Optimistically remove from local set
    setLocalUnreadSet(prev => {
      const newSet = new Set(prev)
      newSet.delete(channelId)
      return newSet
    })

    // Call server
    markReadMutation.mutate({ channelId })
  }

  return {
    unreadSet: localUnreadSet,
    markRead,
    isLoading: markReadMutation.isPending,
  }
}
