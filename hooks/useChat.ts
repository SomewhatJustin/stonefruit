"use client"

import { useEffect } from "react"
import { trpc } from "@/lib/trpcClient"

export type ChatContext = { kind: "channel" | "dm"; id: string }

export function useChat(context: ChatContext, userId: string) {
  // React-Query utilities for cache updates
  const utils = trpc.useUtils()

  const { data: messages = [], isLoading } = trpc.listMessages.useQuery(context)

  const postMutation = trpc.postMessage.useMutation()

  const sendMessage = (text: string) => {
    if (!text.trim()) return
    // Attach current context so the backend knows where to post
    postMutation.mutate({ ...context, text })
  }

  // Attach WebSocket listener once on mount
  useEffect(() => {
    // Determine WebSocket endpoint
    const wsUrl =
      process.env.NEXT_PUBLIC_WS_URL ||
      (window.location.protocol === "https:"
        ? `wss://${window.location.host}/ws`
        : `ws://${window.location.hostname}:$${
            process.env.NEXT_PUBLIC_WS_PORT || 3001
          }`)

    const ws = new WebSocket(wsUrl)

    ws.onopen = () => console.log("🔌 WS connected")
    ws.onerror = e => console.error("WS error", e)

    ws.onmessage = e => {
      try {
        const msg = JSON.parse(e.data)

        let isRelevant = false

        if (context.kind === "channel") {
          isRelevant = msg.channelId === context.id
        } else if (context.kind === "dm") {
          const currentChannelId = messages[0]?.channelId
          if (currentChannelId) {
            isRelevant = msg.channelId === currentChannelId
          } else if (messages.length === 0) {
            // Accept the first message if it's from the current user or the DM partner
            isRelevant = msg.senderId === userId || msg.senderId === context.id
          }
        }

        if (isRelevant) {
          utils.listMessages.setData(
            context,
            old => [...(old ?? []), msg] as any
          )
        }
      } catch (err) {
        console.error("bad ws payload", err)
      }
    }

    return () => {
      ws.close()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    messages,
    isLoading,
    sendMessage,
  }
}
