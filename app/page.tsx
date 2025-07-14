import { auth } from "@/auth"
import { SignIn } from "@/components/SignIn"
import { redirect } from "next/navigation"

export default async function Home() {
  const session = await auth()

  if (!session?.user) {
    // Not logged in: only show login tools
    return (
      <div className="flex flex-col min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <h1 className="text-5xl font-bold">Stonefruit</h1>
          <SignIn />

        </div>
      </div>
    )
  }

  // Logged in: redirect to the default "general" channel
  redirect("/channels/general")
}
