import Image from "next/image";
import { SignIn } from "@/app/components/SignIn";
import { auth } from "@/auth";

export default async function Home() {
  const session = await auth();
  console.log(session);
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        {session?.user ? (
          <div>Logged in as {session.user.email}</div>
        ) : null}
        <SignIn />
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
      </footer>
    </div>
  );
}
