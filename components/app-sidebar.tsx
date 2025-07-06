"use client"

import * as React from "react"
import {
  AudioWaveform,
  Blocks,
  Calendar,
  Command,
  Home,
  Inbox,
  MessageCircleQuestion,
  Search,
  Settings2,
  Sparkles,
  Trash2,
} from "lucide-react"

import NavConversations from "@/components/nav-conversations"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import SearchModal from "@/components/SearchModal"
import { useState } from "react"

export function AppSidebar({
  channels,
  dms,
  ...props
}: React.ComponentProps<typeof Sidebar> & { channels: any[]; dms: any[] }) {
  const [searchOpen, setSearchOpen] = useState(false)
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
          <div className="text-lg font-bold ml-2">Fowler Inc.</div>
          {/* <TeamSwitcher teams={data.teams} /> */}
          <NavMain items={navItems} />
        </SidebarHeader>
        <SidebarContent>
          <NavConversations channels={channels} dms={dms} />
          {/* <NavSecondary items={data.navSecondary} className="mt-auto" /> */}
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
      <SearchModal open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  )
}
