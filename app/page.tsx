import { auth } from "@/auth";
import { SignIn } from "@/app/components/SignIn";
import { SignOut } from "./components/SignOut";
import ChatDemo from "./components/ChatDemo";

// Sidebar & navigation components
import { AppSidebar } from "@/components/app-sidebar";
import { NavActions } from "@/components/nav-actions";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { trpc } from "@/lib/trpcClient";
import { appRouter, createContext } from "@/trpc";

export default async function Home() {
  const session = await auth();

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
    );
  }

  const ctx = await createContext();
  const channels = await appRouter
    .createCaller(ctx)
    .listChannels();
  console.log("channels", channels);

  // Logged in: show sidebar and full UI
  return (
    <SidebarProvider>
      {/* Sidebar */}
      <AppSidebar channels={channels} />

      {/* Main content area */}
      <SidebarInset>
        {/* Header */}
        <header className="flex h-14 shrink-0 items-center gap-2">
          <div className="flex flex-1 items-center gap-2 px-3">
            <SidebarTrigger />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage className="line-clamp-1">
                    Chat Demo
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="ml-auto flex items-center gap-2 px-3">
            <div className="hidden text-sm text-muted-foreground sm:block">
              {session.user.email}
            </div>
            <SignOut />
            <NavActions />
          </div>
        </header>

        {/* Page body */}
        <main className="flex flex-col gap-8 p-6">
          <ChatDemo />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
