"use client"

import { CirclePlus, Hash } from "lucide-react"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { trpc } from "@/lib/trpcClient"
import { useState } from "react"

export function NavConversations({
  channels,
  dms,
}: {
  channels: { id: string; name: string }[]
  dms: { id: string; name: string; email: string; image?: string }[]
}) {
  const { isMobile } = useSidebar()

  const [open, setOpen] = useState(false)
  const [localChannels, setLocalChannels] = useState(channels)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [error, setError] = useState<string | null>(null)

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
        <div className="flex items-center justify-between">
          <SidebarGroupLabel>Channels</SidebarGroupLabel>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon" className="size-8">
                <CirclePlus />
              </Button>
            </DialogTrigger>
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
        </div>
        <SidebarMenu>
          {localChannels.map(channel => (
            <SidebarMenuItem key={channel.id}>
              <SidebarMenuButton asChild>
                <a
                  href={`/channels/${channel.id}`}
                  title={channel.name}
                  className="flex items-center"
                >
                  <Hash className="size-4 mr-0 text-muted-foreground" />
                  <span>{channel.name}</span>
                </a>
              </SidebarMenuButton>
              {/* Dropdown actions could go here, retained for potential future use. */}
            </SidebarMenuItem>
          ))}
          <SidebarMenuItem>{/* Spacer / future actions */}</SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>

      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <SidebarGroupLabel>Direct Messages</SidebarGroupLabel>
        <SidebarMenu>
          {dms.map(dm => (
            <SidebarMenuItem key={dm.id}>
              <SidebarMenuButton asChild>
                <a
                  href={`/dm/${dm.id}`}
                  title={dm.email}
                  className="flex items-center gap-2"
                >
                  <img
                    src={dm.image ?? "/avatars/default.png"}
                    alt={dm.email}
                    className="w-5 h-5 rounded-full"
                  />
                  <span>{dm.email}</span>
                </a>
              </SidebarMenuButton>
              {/* Dropdown actions could go here, retained for potential future use. */}
            </SidebarMenuItem>
          ))}
          <SidebarMenuItem>{/* Spacer / future actions */}</SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    </>
  )
}

export default NavConversations
