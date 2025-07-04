"use client"

import {
  ArrowUpRight,
  Link,
  MoreHorizontal,
  StarOff,
  Trash2,
} from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

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
        <SidebarGroupLabel>Channels</SidebarGroupLabel>
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
