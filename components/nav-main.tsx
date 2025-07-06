"use client"

import { type LucideIcon } from "lucide-react"

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url?: string
    icon: LucideIcon
    isActive?: boolean
    onClick?: () => void
  }[]
}) {
  return (
    <SidebarMenu>
      {items.map(item => (
        <SidebarMenuItem key={item.title}>
          {item.onClick ? (
            <SidebarMenuButton onClick={item.onClick} isActive={item.isActive}>
              <item.icon />
              <span>{item.title}</span>
            </SidebarMenuButton>
          ) : (
            <SidebarMenuButton asChild isActive={item.isActive}>
              <a href={item.url}>
                <item.icon />
                <span>{item.title}</span>
              </a>
            </SidebarMenuButton>
          )}
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  )
}
