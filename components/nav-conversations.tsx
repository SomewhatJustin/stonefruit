"use client"

import { CirclePlus } from "lucide-react"

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

export function NavConversations({
  channels,
  dms,
}: {
  channels: { id: string; name: string }[]
  dms: { id: string; name: string; email: string }[]
}) {
  const { isMobile } = useSidebar()

  return (
    <>
      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <div className="flex items-center justify-between">
          <SidebarGroupLabel>Channels</SidebarGroupLabel>

          <Button variant="secondary" size="icon" className="size-8">
            <CirclePlus />
          </Button>
        </div>
        <SidebarMenu>
          {channels.map(channel => (
            <SidebarMenuItem key={channel.id}>
              <SidebarMenuButton asChild>
                <a href={`/channels/${channel.id}`} title={channel.name}>
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
                <a href={`/dm/${dm.id}`} title={dm.email}>
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
