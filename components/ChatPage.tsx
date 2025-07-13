import * as React from "react"
import { auth } from "@/auth"
import { SignIn } from "@/components/SignIn"
import { SignOut } from "@/components/SignOut"
import ChatPanel from "@/components/ChatPanel"
import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { appRouter, createContext } from "@/trpc"
import ManageMembersButton from "@/components/manage-members-button"
import { getProfileDisplayName } from "@/lib/utils"

// Shared chat page that works for both channels and direct messages.
// Pass `variant` along with the corresponding identifier.
export type ChatPageProps =
  | { variant: "channel"; id: string }
  | { variant: "dm"; uid: string }

export default async function ChatPage(props: ChatPageProps) {
  const session = await auth()

  if (!session?.user) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <SignIn />
          <div className="text-muted-foreground text-center">
            Please sign in to view this page.
          </div>
        </div>
      </div>
    )
  }

  const ctx = await createContext()
  const caller = appRouter.createCaller(ctx)
  const [channels, dms] = await Promise.all([
    caller.listChannels(),
    caller.listDirectMessages(),
  ])

  // Resolve display name and context details depending on variant.
  let headerContent: React.ReactNode
  let chatContext: { kind: "channel" | "dm"; id: string }

  if (props.variant === "channel") {
    const currentChannel = channels.find(c => c.id === props.id)
    headerContent = (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage className="line-clamp-1">
              <div className="flex items-center gap-2 ">
                {`#${currentChannel?.name ?? props.id}`}
                {currentChannel?.description && (
                  <span className="hidden md:inline text-sm text-muted-foreground ml-2 line-clamp-1">
                    {currentChannel.description}
                  </span>
                )}
                <ManageMembersButton channelId={props.id} />
              </div>
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    )
    chatContext = { kind: "channel", id: props.id }
  } else {
    const dmUser = dms.find(u => u.id === props.uid)
    headerContent = <div className="text-sm">{dmUser ? getProfileDisplayName(dmUser) : props.uid}</div>
    chatContext = { kind: "dm", id: props.uid }
  }

  return (
    <SidebarProvider>
      <AppSidebar channels={channels} dms={dms} user={session.user} />
      <SidebarInset className="min-h-screen">
        <header className="flex h-14 shrink-0 items-center gap-2 justify-between sticky top-0 w-full bg-background z-10">
          <div className="flex items-center gap-2 px-3">
            <SidebarTrigger />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            {headerContent}
          </div>
          <div className="px-3">
            <SignOut />
          </div>
        </header>
        <main className="flex flex-col gap-8 px-3 pt-6 h-full">
          <ChatPanel context={chatContext} userId={session.user.id!} />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
