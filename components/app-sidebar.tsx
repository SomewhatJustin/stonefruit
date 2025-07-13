"use client"

import * as React from "react"
import { Search, SquarePen, Hash, User } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

import NavConversations from "@/components/nav-conversations"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import SearchModal from "@/components/SearchModal"
import { trpc } from "@/lib/trpcClient"

export function AppSidebar({
  channels,
  dms,
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  channels: any[]
  dms: {
    id: string
    name: string | null
    email: string
    image?: string | null
    channelId?: string | null
  }[]
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
    id?: string
  }
}) {
  const router = useRouter()
  const [searchOpen, setSearchOpen] = useState(false)
  const [composeOpen, setComposeOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Global keyboard shortcut for Ctrl/Cmd + K
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setComposeOpen(true)
      }
    }

    window.addEventListener("keydown", handleGlobalKeyDown)
    return () => window.removeEventListener("keydown", handleGlobalKeyDown)
  }, [])

  // Debounce search query
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query), 300)
    return () => clearTimeout(id)
  }, [query])

  // Search users when query is long enough
  const { data: userSuggestions = [] } = trpc.searchUsers.useQuery(
    { query: debouncedQuery },
    { enabled: debouncedQuery.length > 0 }
  )

  // Filter channels based on query
  const filteredChannels = channels.filter(channel =>
    channel.name.toLowerCase().includes(query.toLowerCase())
  )

  // Filter out current user from user suggestions
  const filteredUserSuggestions = userSuggestions.filter(
    suggestedUser => suggestedUser.id !== user.id
  )

  // Combine and filter results
  const allSuggestions = [
    ...filteredChannels.map(channel => ({
      type: "channel" as const,
      id: channel.id,
      name: channel.name,
      displayName: `${channel.name}`,
    })),
    ...filteredUserSuggestions.map(user => ({
      type: "user" as const,
      id: user.id,
      name: user.name || user.email,
      displayName: user.name || user.email,
      email: user.email,
      image: user.image,
    })),
  ]

  // Reset selected index when suggestions change
  useEffect(() => {
    setSelectedIndex(0)
  }, [allSuggestions.length])

  const handleSelect = (suggestion: (typeof allSuggestions)[0]) => {
    if (suggestion.type === "channel") {
      router.push(`/channels/${suggestion.id}`)
    } else {
      router.push(`/dm/${suggestion.id}`)
    }
    setComposeOpen(false)
    setQuery("")
    setSelectedIndex(0)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (allSuggestions.length === 0) return

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setSelectedIndex(prev =>
          prev < allSuggestions.length - 1 ? prev + 1 : prev
        )
        break
      case "ArrowUp":
        e.preventDefault()
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev))
        break
      case "Enter":
        e.preventDefault()
        if (allSuggestions[selectedIndex]) {
          handleSelect(allSuggestions[selectedIndex])
        }
        break
      case "Escape":
        setComposeOpen(false)
        setQuery("")
        setSelectedIndex(0)
        break
    }
  }

  const handleDialogClose = (open: boolean) => {
    setComposeOpen(open)
    if (!open) {
      setQuery("")
      setSelectedIndex(0)
    }
  }

  const navItems = [
    // {
    //   title: "Home",
    //   url: "/",
    //   icon: Home,
    // },
    {
      title: "Search",
      icon: Search,
      onClick: () => setSearchOpen(true),
    },
  ]

  return (
    <>
      <Sidebar className="border-r-0" {...props}>
        <SidebarHeader>
          <div className="flex items-center justify-between">
            <div className="text-lg font-bold ml-2">Fowler Inc.</div>
            <Button
              variant="default"
              size="icon"
              className="size-8 bg-orange-600 hover:bg-orange-700 text-white"
              onClick={() => setComposeOpen(true)}
              title="Compose (Ctrl+K)"
            >
              <SquarePen className="size-4" />
            </Button>
          </div>
          {/* <TeamSwitcher teams={data.teams} /> */}
          <NavMain items={navItems} />
        </SidebarHeader>
        <SidebarContent>
          <NavConversations channels={channels} dms={dms} userId={user.id} />
          <NavUser user={user} />
          {/* <NavSecondary items={data.navSecondary} className="mt-auto" /> */}
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
      <SearchModal open={searchOpen} onOpenChange={setSearchOpen} />

      <Dialog open={composeOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Compose Message</DialogTitle>
            <DialogDescription>
              Start typing to find a channel or person to message.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              autoFocus
              placeholder="Search channels or people..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
            />

            {query.length > 0 && (
              <div className="max-h-60 overflow-y-auto">
                {allSuggestions.length > 0 ? (
                  <ul className="space-y-1">
                    {allSuggestions.map((suggestion, index) => (
                      <li key={`${suggestion.type}-${suggestion.id}`}>
                        <button
                          onClick={() => handleSelect(suggestion)}
                          className={`w-full flex items-center gap-3 p-3 rounded-md text-left transition-colors ${
                            index === selectedIndex
                              ? "bg-accent text-accent-foreground"
                              : "hover:bg-accent hover:text-accent-foreground"
                          }`}
                        >
                          <div className="flex-shrink-0">
                            {suggestion.type === "channel" ? (
                              <Hash className="size-4 text-muted-foreground" />
                            ) : (
                              <div className="size-6 rounded-full bg-muted flex items-center justify-center">
                                {suggestion.image ? (
                                  <img
                                    src={suggestion.image}
                                    alt={suggestion.displayName}
                                    className="size-6 rounded-full"
                                  />
                                ) : (
                                  <User className="size-3 text-muted-foreground" />
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">
                              {suggestion.displayName}
                            </div>
                            {suggestion.type === "user" && suggestion.email && (
                              <div className="text-sm text-muted-foreground truncate">
                                {suggestion.email}
                              </div>
                            )}
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    No channels or people found
                  </div>
                )}
              </div>
            )}

            {query.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                Start typing to search for channels or people
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
