"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { trpc } from "@/lib/trpcClient"

// Simple debounce hook
function useDebounce<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}

// Escape regex special chars
function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function getSnippet(content: string, query: string, radius = 50) {
  const lower = content.toLowerCase()
  const lowerQ = query.toLowerCase()
  const idx = lower.indexOf(lowerQ)
  let snippet: string
  if (idx === -1) {
    snippet = content.slice(0, 100)
  } else {
    const start = Math.max(0, idx - radius)
    const end = Math.min(content.length, idx + query.length + radius)
    snippet = content.slice(start, end)
  }
  // Highlight
  const regex = new RegExp(`(${escapeRegExp(query)})`, "ig")
  return snippet.replace(regex, "<mark>$1</mark>")
}

export default function SearchModal({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const debounced = useDebounce(query)

  const { data: results, isLoading } = trpc.searchMessages.useQuery(
    { query: debounced },
    { enabled: debounced.length > 0 }
  )

  const handleNavigate = (r: NonNullable<typeof results>[number]) => {
    // Construct target url
    let url: string
    if (r.isDirect && r.dmUserId) {
      url = `/dm/${r.dmUserId}#msg-${r.id}`
    } else {
      url = `/channels/${r.channelId}#msg-${r.id}`
    }
    router.push(url)
    onOpenChange(false)
  }

  // Memoize rendered list
  const renderedResults = useMemo(() => {
    if (!results || results.length === 0) return null
    return (
      <ul className="divide-y">
        {results.map(r => (
          <li key={r.id}>
            <button
              onClick={() => handleNavigate(r)}
              className="flex flex-col w-full text-left py-3 px-2 hover:bg-accent"
            >
              <span className="font-medium line-clamp-1">
                {r.isDirect ? `DM` : `#${r.channelName}`}
              </span>
              <span
                className="text-sm text-muted-foreground line-clamp-2"
                dangerouslySetInnerHTML={{
                  __html: getSnippet(r.content, query),
                }}
              />
            </button>
          </li>
        ))}
      </ul>
    )
  }, [results, query])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[90vw] h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="sr-only">Search</DialogTitle>
          <DialogDescription className="sr-only">
            Search through your accessible conversations.
          </DialogDescription>
        </DialogHeader>
        <Input
          autoFocus
          className="text-2xl"
          placeholder="Search messages…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <div className="flex-1 overflow-y-auto mt-6">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : results && results.length > 0 ? (
            renderedResults
          ) : query.length > 0 ? (
            <div className="text-center text-muted-foreground mt-10">
              No results
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
