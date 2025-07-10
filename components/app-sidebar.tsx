"use client"

import * as React from "react"
import { Search } from "lucide-react"

import NavConversations from "@/components/nav-conversations"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"

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
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  channels: any[]
  dms: any[]
  user: { name?: string | null; email?: string | null; image?: string | null }
}) {
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
          <NavUser user={user} />
          {/* <NavSecondary items={data.navSecondary} className="mt-auto" /> */}
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
      <SearchModal open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  )
}
