import { auth } from "@/auth"
import { SignIn } from "@/components/SignIn"
import { SignOut } from "@/components/SignOut"

// Sidebar & navigation components
import { AppSidebar } from "@/components/app-sidebar"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { appRouter, createContext } from "@/trpc"

export default async function Home() {
  const session = await auth()

  if (!session?.user) {
    // Not logged in: only show login tools
    return (
      <div className="flex flex-col min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <SignIn />
          <div className="text-muted-foreground text-center">
            Please sign in to use the chat demo.
          </div>
        </div>
      </div>
    )
  }

  const ctx = await createContext()
  const channels = await appRouter.createCaller(ctx).listChannels()
  const dms = await appRouter.createCaller(ctx).listDirectMessages()

  // Logged in: show sidebar and full UI
  return (
    <SidebarProvider>
      <AppSidebar channels={channels} dms={dms} />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 justify-between">
          <div className="flex items-center gap-2 px-3">
            <SidebarTrigger />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
          </div>
          <div className="px-3">
            <SignOut />
          </div>
        </header>

        {/* Page body */}
        <main className="flex flex-col gap-8 p-6 h-full">
          {/* <ChatPanel /> */}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
