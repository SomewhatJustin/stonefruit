import { signOut } from "@/auth";

export function SignOut({ className, ...props }: React.ComponentProps<"form">) {
  return (
    <form
      action={async () => {
        "use server";
        await signOut();
      }}
      className={className}
    >
      <button type="submit">Sign Out</button>
    </form>
  );
}
