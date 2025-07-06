"use client"

import SearchModal from "@/components/SearchModal"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function SearchPage() {
  const [open, setOpen] = useState(true)
  const router = useRouter()

  return (
    <SearchModal
      open={open}
      onOpenChange={o => {
        setOpen(o)
        if (!o) router.back()
      }}
    />
  )
}
