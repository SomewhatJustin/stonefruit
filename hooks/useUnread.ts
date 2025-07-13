"use client"

import { useEffect, useState, useMemo, useRef } from "react"
import { usePathname } from "next/navigation"
import { trpc } from "@/lib/trpcClient"

export function useUnread(userId?: string) {
  const pathname = usePathname()
  const utils = trpc.useUtils()
  const [localUnreadSet, setLocalUnreadSet] = useState<Set<string>>(new Set())
  // Track unread direct-message senders (user ids)
  const [localUnreadUsers, setLocalUnreadUsers] = useState<Set<string>>(new Set())

  // Map channelId → userIds (DM participants) so we can clear user unread on markRead
  const dmChannelMapRef = useRef<Record<string, Set<string>>>({})

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

  // Mark channel as read function
  const markReadMutation = trpc.read.mark.useMutation({
    onSuccess: () => {
      // Invalidate the unread list to update the UI
      utils.read.list.invalidate()
    },
  })

  const markRead = (channelId: string) => {
    // Optimistically remove from local channel set
    setLocalUnreadSet(prev => {
      const newSet = new Set(prev)
      newSet.delete(channelId)
      return newSet
    })

    // Also clear any DM user unread items associated with this channel
    const userIds = dmChannelMapRef.current[channelId]
    if (userIds && userIds.size > 0) {
      setLocalUnreadUsers(prev => {
        const newSet = new Set(prev)
        userIds.forEach(uid => newSet.delete(uid))
        return newSet
      })
    }

    // Call server
    markReadMutation.mutate({ channelId })
  }

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

          // Determine if this is a direct-message or channel message
          const isDirect = data?.channel?.isDirect === true

          // Check if we're currently viewing this conversation
          const isCurrentlyViewing = (() => {
            if (isDirect) {
              // DM URLs are /dm/<userId>
              return pathname?.startsWith("/dm/") &&
                pathname.split("/dm/")[1] === data.senderId
            }
            // Channel – fallback to previous logic
            return (
              pathname?.includes(data.channelId) ||
              (pathname?.startsWith("/channels/") &&
                pathname.split("/channels/")[1] === data.channelId)
            )
          })()

          if (!isCurrentlyViewing) {
            // Add to unread set
            setLocalUnreadSet(prev => new Set([...prev, data.channelId]))

            if (isDirect) {
              // Track unread DM sender
              setLocalUnreadUsers(prev => new Set([...prev, data.senderId]))

              // Maintain channel → user mapping so we can clear later
              dmChannelMapRef.current[data.channelId] = dmChannelMapRef.current[
                data.channelId
              ] ?? new Set<string>()
              dmChannelMapRef.current[data.channelId].add(data.senderId)
            }
          } else {
            // We ARE currently viewing this conversation – make sure any lingering
            // unread flags are removed so they don’t show up after we navigate away.
            setLocalUnreadSet(prev => {
              if (!prev.has(data.channelId)) return prev
              const next = new Set(prev)
              next.delete(data.channelId)
              return next
            })

            if (isDirect) {
              console.log("removing unread flag for", data.senderId)
              setLocalUnreadUsers(prev => {
                if (!prev.has(data.senderId)) return prev
                const next = new Set(prev)
                next.delete(data.senderId)
                return next
              })
            }
            // We ARE currently viewing – clear server-side unread state too
            if (data.channelId) {
              markRead(data.channelId)
            }
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

  return {
    unreadSet: localUnreadSet,
    unreadDmUsers: localUnreadUsers,
    markRead,
    isLoading: markReadMutation.isPending,
  }
}
