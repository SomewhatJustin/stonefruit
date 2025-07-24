"use client"

import { useRef, useEffect, useState } from "react"
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
  const [shouldOpenUpward, setShouldOpenUpward] = useState(false)

  // Calculate positioning when picker opens
  useEffect(() => {
    if (!isOpen || !triggerRef.current) return

    const calculatePosition = () => {
      if (!triggerRef.current) return

      const triggerRect = triggerRef.current.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const pickerHeight = 350 // Approximate height of the emoji picker
      
      // Check if there's enough space below the trigger
      const spaceBelow = viewportHeight - triggerRect.bottom
      const shouldOpenUp = spaceBelow < pickerHeight && triggerRect.top > pickerHeight
      
      setShouldOpenUpward(shouldOpenUp)
    }

    calculatePosition()
    
    // Recalculate on window resize
    window.addEventListener('resize', calculatePosition)
    return () => window.removeEventListener('resize', calculatePosition)
  }, [isOpen, triggerRef])

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
      className={`absolute z-50 right-0 shadow-lg rounded-lg border bg-background ${
        shouldOpenUpward 
          ? "bottom-full mb-1" 
          : "top-full mt-1"
      }`}
    >
      <Picker
        data={data}
        onEmojiSelect={(emoji: { native: string }) => {
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
