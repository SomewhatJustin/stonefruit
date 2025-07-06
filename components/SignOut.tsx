import { signOut } from "@/auth"
import { LogOut } from "lucide-react"

export function SignOut({ className, ...props }: React.ComponentProps<"form">) {
  return (
    <form
      action={async () => {
        "use server"
        await signOut()
      }}
      className={className}
    >
      <button type="submit" className="text-sm" aria-label="Sign Out">
        <LogOut className="w-5 h-5" />
      </button>
    </form>
  )
}
