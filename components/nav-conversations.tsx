"use client"

import { Plus, Hash, Check, Users, ChevronDown } from "lucide-react"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { trpc } from "@/lib/trpcClient"
import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { useUnread } from "@/hooks/useUnread"
import { getProfileDisplayName } from "@/lib/utils"

export function NavConversations({
  channels,
  dms,
  userId,
}: {
  channels: { id: string; name: string }[]
  dms: {
    id: string
    name: string | null
    email: string
    image?: string | null
    channelId?: string | null
  }[]
  userId?: string
}) {
  const pathname = usePathname()
  const router = useRouter()

  const [open, setOpen] = useState(false)
  const [browseOpen, setBrowseOpen] = useState(false)
  const [localChannels, setLocalChannels] = useState(channels)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [error, setError] = useState<string | null>(null)

  // Use the centralized unread hook
  const { unreadSet, unreadDmUsers } = useUnread(userId)

  // Query for all channels when browsing
  const { data: allChannels = [], isLoading: isLoadingAllChannels } = trpc.listAllChannels.useQuery(
    undefined,
    { enabled: browseOpen }
  )

  const utils = trpc.useUtils()

  const joinChannel = trpc.addChannelMember.useMutation({
    onSuccess: (_, variables) => {
      // Update local channels list if not already there
      const existingChannel = localChannels.find(c => c.id === variables.channelId)
      if (!existingChannel) {
        const channelToAdd = allChannels.find(c => c.id === variables.channelId)
        if (channelToAdd) {
          setLocalChannels(prev => [
            ...prev,
            { id: channelToAdd.id, name: channelToAdd.name ?? "Unnamed Channel" },
          ])
        }
      }
      // Invalidate queries to refresh data
      utils.listChannels.invalidate()
      utils.listAllChannels.invalidate()
      // Navigate to the channel
      router.push(`/channels/${variables.channelId}`)
      setBrowseOpen(false)
    },
  })

  const handleChannelClick = (channel: { id: string; name: string | null; isMember: boolean }) => {
    if (channel.isMember) {
      // Navigate to channel if already a member
      router.push(`/channels/${channel.id}`)
      setBrowseOpen(false)
    } else {
      // Join the channel if not a member
      if (userId) {
        joinChannel.mutate({ channelId: channel.id, userId })
      }
    }
  }

  const createChannel = trpc.createChannel.useMutation({
    onSuccess: newChannel => {
      setLocalChannels(prev => [
        ...prev,
        { id: newChannel.id, name: newChannel.name ?? "" },
      ])
      setName("")
      setDescription("")
      setError(null)
      setOpen(false)
      // Navigate to the new channel and trigger add members dialog
      router.push(`/channels/${newChannel.id}?addMembers=true`)
    },
    onError: err => setError(err.message),
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (localChannels.some(c => c.name === name.trim())) {
      setError("Channel name already exists")
      return
    }
    createChannel.mutate({
      name: name.trim(),
      description: description.trim(),
    })
  }

  return (
    <>
      <SidebarGroup className="group-data-[collapsible=icon]:hidden ">
        <SidebarGroupLabel>Channels</SidebarGroupLabel>
        <SidebarMenu>
          {localChannels.map(channel => {
            const isActive = pathname?.startsWith(`/channels/${channel.id}`)
            const isUnread = unreadSet.has(channel.id)
            return (
              <SidebarMenuItem key={channel.id}>
                <SidebarMenuButton asChild isActive={isActive}>
                  <Link
                    href={`/channels/${channel.id}`}
                    title={channel.name}
                    className="flex items-center"
                  >
                    <Hash className="size-4 mr-0 text-muted-foreground" />
                    <span>{channel.name}</span>
                    {isUnread && !isActive && (
                      <span
                        className="ml-auto h-2 w-2 rounded-full bg-primary"
                        aria-label="unread"
                      />
                    )}
                  </Link>
                </SidebarMenuButton>
                {/* Dropdown actions could go here, retained for potential future use. */}
              </SidebarMenuItem>
            )
          })}
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="border border-dashed border-muted-foreground/30 text-muted-foreground hover:text-foreground hover:border-muted-foreground/50">
                  <Plus className="size-4 mr-0" />
                  <span>Add Channel</span>
                  <ChevronDown className="size-3 ml-auto opacity-50" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[200px]">
                <DropdownMenuItem onClick={() => setOpen(true)}>
                  <Plus className="size-4 mr-2" />
                  Create channel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setBrowseOpen(true)}>
                  <Users className="size-4 mr-2" />
                  Browse channels
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={open} onOpenChange={setOpen}>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>New channel</DialogTitle>
                  <DialogDescription>
                    Give your channel a name and description.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4">
                  <div className="grid gap-3">
                    <label htmlFor="name" className="text-sm font-medium">
                      Name
                    </label>
                    <Input
                      id="name"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid gap-3">
                    <label htmlFor="description" className="text-sm font-medium">
                      Description
                    </label>
                    <Input
                      id="description"
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                    />
                  </div>
                  {error && (
                    <div className="text-destructive text-sm">{error}</div>
                  )}
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline" type="button">
                        Cancel
                      </Button>
                    </DialogClose>
                    <Button
                      type="submit"
                      disabled={createChannel.status === "pending"}
                    >
                      {createChannel.status === "pending"
                        ? "Creating…"
                        : "Create"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={browseOpen} onOpenChange={setBrowseOpen}>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Browse channels</DialogTitle>
                  <DialogDescription>
                    Discover and join channels in your workspace.
                  </DialogDescription>
                </DialogHeader>
                {isLoadingAllChannels ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-muted-foreground">Loading channels...</div>
                  </div>
                ) : (
                  <div className="max-h-[400px] overflow-y-auto">
                    {allChannels.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No channels found.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {allChannels.map(channel => (
                          <div
                            key={channel.id}
                            onClick={() => handleChannelClick(channel)}
                            className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-accent transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <Hash className="size-4 text-muted-foreground" />
                              <div className="flex flex-col">
                                <span className="font-medium">{channel.name ?? "Unnamed Channel"}</span>
                                {channel.description && (
                                  <span className="text-sm text-muted-foreground line-clamp-1">
                                    {channel.description}
                                  </span>
                                )}
                                <span className="text-xs text-muted-foreground">
                                  {channel.memberCount} {channel.memberCount === 1 ? 'member' : 'members'}
                                </span>
                              </div>
                            </div>
                            {channel.isMember && (
                              <Check className="size-4 text-green-600" />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Close</Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>

      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <SidebarGroupLabel>Direct Messages</SidebarGroupLabel>
        <SidebarMenu>
          {dms.map(dm => {
            const isActive = pathname?.startsWith(`/dm/${dm.id}`)
            // Check if this DM has unread messages using the channelId from server
            const isUnread = dm.channelId
              ? unreadSet.has(dm.channelId)
              : unreadDmUsers.has(dm.id)
            return (
              <SidebarMenuItem key={dm.id}>
                <SidebarMenuButton asChild isActive={isActive}>
                  <Link
                    href={`/dm/${dm.id}`}
                    title={getProfileDisplayName(dm)}
                    className="flex items-center gap-2"
                  >
                    <img
                      src={dm.image ?? "/avatars/default.png"}
                      alt={getProfileDisplayName(dm)}
                      className="w-5 h-5 rounded-full"
                    />
                    <span>{getProfileDisplayName(dm)}</span>
                    {isUnread && !isActive && (
                      <span
                        className="ml-auto h-2 w-2 rounded-full bg-primary"
                        aria-label="unread"
                      />
                    )}
                  </Link>
                </SidebarMenuButton>
                {/* Dropdown actions could go here, retained for potential future use. */}
              </SidebarMenuItem>
            )
          })}
          <SidebarMenuItem>{/* Spacer / future actions */}</SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    </>
  )
}

export default NavConversations
