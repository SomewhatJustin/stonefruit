import { auth } from "@/auth";
import { SignIn } from "@/components/SignIn";
import { SignOut } from "@/components/SignOut";
import ChatPanel from "@/components/ChatPanel";
import { AppSidebar } from "@/components/app-sidebar";
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
import { appRouter, createContext } from "@/trpc";

export default async function DmPage({ params }: { params: { uid: string } }) {
  const session = await auth();

  if (!session?.user) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <SignIn />
          <div className="text-muted-foreground text-center">
            Please sign in to view this DM.
          </div>
        </div>
      </div>
    );
  }

  const ctx = await createContext();
  const caller = appRouter.createCaller(ctx);
  const channels = await caller.listChannels();
  const dms = await caller.listDirectMessages();
  const dmUser = dms.find((u) => u.id === params.uid);

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
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage className="line-clamp-1">
                    {dmUser?.email ?? params.uid}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="px-3">
            <SignOut />
          </div>
        </header>
        <main className="flex flex-col gap-8 p-6 h-full">
          <ChatPanel
            context={{ kind: "dm", id: params.uid }}
            userId={session.user.id!}
          />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
