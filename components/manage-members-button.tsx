"use client"

import { Users, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog"
import { trpc } from "@/lib/trpcClient"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"

export default function ManageMembersButton({
  channelId,
}: {
  channelId: string
}) {
  const [open, setOpen] = useState(false)

  const utils = trpc.useUtils()

  const { data: members = [], isLoading } = trpc.listChannelMembers.useQuery({
    channelId,
  })

  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")

  // Debounce typing
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(id)
  }, [search])

  const { data: suggestions = [] } = trpc.searchUsers.useQuery(
    { query: debouncedSearch },
    { enabled: debouncedSearch.length > 1 }
  )

  const addMember = trpc.addChannelMember.useMutation({
    onSuccess: () => {
      setSearch("")
      utils.listChannelMembers.invalidate({ channelId })
    },
  })

  const removeMember = trpc.removeChannelMember.useMutation({
    onSuccess: () => {
      utils.listChannelMembers.invalidate({ channelId })
    },
  })

  const currentMemberIds = new Set(members.map(m => m.user.id))

  const filteredSuggestions = suggestions.filter(
    u => !currentMemberIds.has(u.id)
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Users />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Channel Members</DialogTitle>
          <DialogDescription>
            List of current channel members.
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div>Loading…</div>
        ) : (
          <ul className="space-y-2 max-h-60 overflow-y-auto">
            {members.map(m => (
              <li
                key={m.user.id}
                className="flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2">
                  <img
                    src={m.user.image ?? "/avatars/default.png"}
                    alt={m.user.email}
                    className="w-6 h-6 rounded-full"
                  />
                  <span>{m.user.email}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() =>
                    removeMember.mutate({ channelId, userId: m.user.id })
                  }
                >
                  <X className="size-4" />
                </Button>
              </li>
            ))}
            {members.length === 0 && (
              <li className="text-muted-foreground text-sm">No members yet</li>
            )}
          </ul>
        )}
        <div className="mt-4 space-y-2">
          <Input
            placeholder="Add member by name or email"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {filteredSuggestions.length > 0 && (
            <ul className="max-h-40 overflow-y-auto border rounded-md">
              {filteredSuggestions.map(s => (
                <li
                  key={s.id}
                  className="flex items-center justify-between px-2 py-1 hover:bg-accent cursor-pointer"
                  onClick={() => addMember.mutate({ channelId, userId: s.id })}
                >
                  <div className="flex items-center gap-2">
                    <img
                      src={s.image ?? "/avatars/default.png"}
                      alt={s.email}
                      className="w-5 h-5 rounded-full"
                    />
                    <span>{s.email}</span>
                  </div>
                  <Plus className="size-4" />
                </li>
              ))}
            </ul>
          )}
        </div>
        <DialogClose asChild>
          <Button variant="outline">Close</Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  )
}
