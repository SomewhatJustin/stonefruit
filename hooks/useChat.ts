"use client"

import { useEffect, useState, useRef } from "react"
import { trpc } from "@/lib/trpcClient"
import { useUnread } from "@/hooks/useUnread"
import { isEventRelevant } from "@/lib/utils"

export type ChatContext = { kind: "channel" | "dm"; id: string }

export function useChat(context: ChatContext, userId: string) {
  // React-Query utilities for cache updates
  const utils = trpc.useUtils()

  // Use centralized unread management
  const { markRead } = useUnread(userId)

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
  const reactionMutation = trpc.reactionToggle.useMutation()

  const sendMessage = (text: string) => {
    if (!text.trim()) return
    // Attach current context so the backend knows where to post
    postMutation.mutate({ ...context, text })
  }

  const toggleReaction = (messageId: string, emoji: string) => {
    reactionMutation.mutate({ messageId, emoji })
  }

  const [typingUser, setTypingUser] = useState<string | null>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastTypingSentRef = useRef(0)

  const typingMutation = trpc.sendTyping.useMutation()

  const sendTyping = () => {
    const now = Date.now()
    if (now - lastTypingSentRef.current < 2000) return // throttle 2s
    lastTypingSentRef.current = now
    console.log("🔤 Sending typing indicator:", context)
    typingMutation.mutate(context, {
      onSuccess: () => console.log("✅ Typing mutation success"),
      onError: (err) => console.error("❌ Typing mutation failed:", err)
    })
  }

  // Attach WebSocket listener once on mount
  useEffect(() => {
    // Determine WebSocket endpoint once
    const wsUrl =
      process.env.NEXT_PUBLIC_WS_URL ||
      (window.location.protocol === "https:"
        ? `wss://${window.location.host}/ws`
        : `ws://${window.location.hostname}:${
            process.env.NEXT_PUBLIC_WS_PORT || 3001
          }`)

    // Share a single WebSocket across the whole app
    const globalForWs = window as unknown as { __chatWs?: WebSocket }
    if (!globalForWs.__chatWs || globalForWs.__chatWs.readyState === 3) {
      globalForWs.__chatWs = new WebSocket(wsUrl)
      globalForWs.__chatWs.addEventListener("open", () =>
        console.log("🔌 WS connected")
      )
      globalForWs.__chatWs.addEventListener("error", e => {
        // Log once; avoid React devtools flood
        console.warn("WS error", e)
      })
    }

    const ws = globalForWs.__chatWs

    const handleMessage = (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data)

        if (data.type === "typing") {
          console.log("📨 Received typing event:", data)
          console.log("Context:", context)
          console.log("UserId:", userId)
          console.log("Messages:", messages)
          console.log("Event data:", data)
          const relevant = isEventRelevant(context, data, userId, messages)
          console.log("🎯 Typing relevant:", relevant, "not from self:", data.userId !== userId)
          if (relevant && data.userId !== userId) {
            console.log("👤 Setting typing user:", data.name)
            setTypingUser(data.name ?? "Someone")
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
            typingTimeoutRef.current = setTimeout(() => {
              setTypingUser(null)
            }, 3000)
          }
          return
        }

        if (data.type === "reaction") {
          const relevant =
            context.kind === "channel"
              ? data.channelId === context.id
              : messages.some(m => m.channelId === data.channelId)

          if (relevant) {
            utils.listMessages.setData(context, old => {
              if (!old) return old
              return old.map(msg =>
                msg.id === data.messageId
                  ? { ...msg, reactions: data.reactions }
                  : msg
              )
            })
          }
          return
        }

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
        console.warn("bad ws payload", err)
      }
    }

    ws.addEventListener("message", handleMessage)

    return () => {
      ws.removeEventListener("message", handleMessage)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context.id, context.kind, messages])

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    sendTyping,
    typingUser,
    toggleReaction,
    markRead,
  }
}
