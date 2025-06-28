import Image from "next/image";
import { SignIn } from "@/app/components/SignIn";
import { auth } from "@/auth";
import { SignOut } from "./components/SignOut";

export default async function Home() {
  const session = await auth();
  console.log(session);
  const otherUsers = await fetch("/api/users").then((res) => res.json());
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        {session?.user ? (
          <div>Logged in as {session.user.email}</div>
        ) : null}
        {session?.user ? (
          <SignOut />
        ) : (
          <SignIn />
        )}
        {otherUsers.map((user) => (
          <div key={user.id}>{user.email}</div>
        ))}
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
      </footer>
    </div>
  );
}
