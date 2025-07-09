"use client"

import { useState, useRef, useEffect } from "react"
import data from "@emoji-mart/data"
import Picker from "@emoji-mart/react"

interface EmojiPickerProps {
  isOpen: boolean
  onClose: () => void
  onEmojiSelect: (emoji: string) => void
  triggerRef: React.RefObject<HTMLElement>
}

export default function EmojiPicker({
  isOpen,
  onClose,
  onEmojiSelect,
  triggerRef,
}: EmojiPickerProps) {
  const pickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        onClose()
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleEscape)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [isOpen, onClose, triggerRef])

  if (!isOpen) return null

  return (
    <div
      ref={pickerRef}
      className="absolute z-50 top-full right-0 mt-1 shadow-lg rounded-lg border bg-background"
    >
      <Picker
        data={data}
        onEmojiSelect={(emoji: any) => {
          onEmojiSelect(emoji.native)
          onClose()
        }}
        theme="dark"
        set="native"
        previewPosition="none"
        skinTonePosition="none"
        maxFrequentRows={0}
        perLine={8}
        emojiSize={20}
      />
    </div>
  )
}
