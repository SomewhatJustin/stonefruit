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
import { useSearchParams, useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { getProfileDisplayName } from "@/lib/utils"

export default function ManageMembersButton({
  channelId,
}: {
  channelId: string
}) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isNewChannelFlow, setIsNewChannelFlow] = useState(false)

  const utils = trpc.useUtils()

  // Check for URL parameter to auto-open dialog
  useEffect(() => {
    if (searchParams.get('addMembers') === 'true') {
      setOpen(true)
      setIsNewChannelFlow(true)
      // Clean up URL parameter
      const url = new URL(window.location.href)
      url.searchParams.delete('addMembers')
      router.replace(url.pathname + url.search, { scroll: false })
    }
  }, [searchParams, router])

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

  // Reset new channel flow state when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      setIsNewChannelFlow(false)
    }
  }

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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Users />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isNewChannelFlow ? "Invite people to your channel" : "Channel Members"}
          </DialogTitle>
          <DialogDescription>
            {isNewChannelFlow 
              ? "Great! Your channel has been created. Now invite teammates to join the conversation."
              : "List of current channel members."
            }
          </DialogDescription>
        </DialogHeader>
        {isNewChannelFlow ? (
          // New channel flow: Emphasize adding members
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Add people to your channel</label>
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {filteredSuggestions.length > 0 && (
                <ul className="max-h-40 overflow-y-auto border rounded-md">
                  {filteredSuggestions.map(s => (
                    <li
                      key={s.id}
                      className="flex items-center justify-between px-3 py-2 hover:bg-accent cursor-pointer"
                      onClick={() => addMember.mutate({ channelId, userId: s.id })}
                    >
                      <div className="flex items-center gap-2">
                        <img
                          src={s.image ?? "/avatars/default.png"}
                          alt={getProfileDisplayName(s)}
                          className="w-6 h-6 rounded-full"
                        />
                        <span>{getProfileDisplayName(s)}</span>
                      </div>
                      <Plus className="size-4 text-green-600" />
                    </li>
                  ))}
                </ul>
              )}
              {debouncedSearch.length > 1 && filteredSuggestions.length === 0 && (
                <p className="text-sm text-muted-foreground px-3 py-2">
                  No users found matching &ldquo;{debouncedSearch}&rdquo;
                </p>
              )}
            </div>
            
            {/* Show current members in a smaller, less prominent section */}
            {!isLoading && members.length > 0 && (
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-2">Current members ({members.length})</h4>
                <ul className="space-y-1 max-h-32 overflow-y-auto">
                  {members.map(m => (
                    <li key={m.user.id} className="flex items-center gap-2 text-sm">
                      <img
                        src={m.user.image ?? "/avatars/default.png"}
                        alt={getProfileDisplayName(m.user)}
                        className="w-5 h-5 rounded-full"
                      />
                      <span>{getProfileDisplayName(m.user)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          // Existing channel members flow: Show current layout
          <>
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
                        alt={getProfileDisplayName(m.user)}
                        className="w-6 h-6 rounded-full"
                      />
                      <span>{getProfileDisplayName(m.user)}</span>
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
                          alt={getProfileDisplayName(s)}
                          className="w-5 h-5 rounded-full"
                        />
                        <span>{getProfileDisplayName(s)}</span>
                      </div>
                      <Plus className="size-4" />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
        <DialogClose asChild>
          <Button variant="outline">
            {isNewChannelFlow ? "Done" : "Close"}
          </Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  )
}
