"use client"

import { useEffect, useState, useRef } from "react"
import { trpc } from "@/lib/trpcClient"

export type ChatContext = { kind: "channel" | "dm"; id: string }

export function useChat(context: ChatContext, userId: string) {
  // React-Query utilities for cache updates
  const utils = trpc.useUtils()

  const {
    data: messages = [],
    isLoading,
    error,
  } = trpc.listMessages.useQuery(context, {
    // Stop retries to surface errors immediately
    retry: (failureCount, err: any) => {
      if (err?.data?.code === "FORBIDDEN") return false
      // keep default retry for other errors up to 2 attempts
      return failureCount < 2
    },
  })

  const postMutation = trpc.postMessage.useMutation()

  const sendMessage = (text: string) => {
    if (!text.trim()) return
    // Attach current context so the backend knows where to post
    postMutation.mutate({ ...context, text })
  }

  const [typingUser, setTypingUser] = useState<string | null>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastTypingSentRef = useRef(0)

  const typingMutation = trpc.sendTyping.useMutation()

  const sendTyping = () => {
    const now = Date.now()
    if (now - lastTypingSentRef.current < 2000) return // throttle 2s
    lastTypingSentRef.current = now
    typingMutation.mutate(context)
  }

  // Attach WebSocket listener once on mount
  useEffect(() => {
    // Determine WebSocket endpoint
    const wsUrl =
      process.env.NEXT_PUBLIC_WS_URL ||
      (window.location.protocol === "https:"
        ? `wss://${window.location.host}/ws`
        : `ws://${window.location.hostname}:${
            process.env.NEXT_PUBLIC_WS_PORT || 3001
          }`)

    const ws = new WebSocket(wsUrl)
    console.log("🔌 WS URL", wsUrl)
    ws.onopen = () => console.log("🔌 WS connected")
    ws.onerror = e => console.error("WS error", e)

    ws.onmessage = e => {
      try {
        const data = JSON.parse(e.data)

        // Handle typing payloads first
        if (data.type === "typing") {
          const relevant = context.kind === data.kind && data.id === context.id
          if (relevant && data.userId !== userId) {
            setTypingUser(data.name ?? "Someone")
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
            typingTimeoutRef.current = setTimeout(() => {
              setTypingUser(null)
            }, 3000)
          }
          return
        }

        // Handle new message payloads (no type property)
        let isRelevant = false
        if (context.kind === "channel") {
          isRelevant = data.channelId === context.id
        } else if (context.kind === "dm") {
          const currentChannelId = messages[0]?.channelId
          if (currentChannelId) {
            isRelevant = data.channelId === currentChannelId
          } else if (messages.length === 0) {
            isRelevant =
              data.senderId === userId || data.senderId === context.id
          }
        }

        if (isRelevant) {
          utils.listMessages.setData(
            context,
            old => [...(old ?? []), data] as any
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
    error,
    sendMessage,
    sendTyping,
    typingUser,
  }
}
