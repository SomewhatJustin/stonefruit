import { signIn } from "@/auth";

export function SignIn() {
  return (
    <form
      action={async (formData: FormData) => {
        "use server";
        // Email provider id (matches auth.ts configuration)
        await signIn("mailgun", formData);
      }}
      className="flex flex-col gap-2"
    >
      <input
        type="email"
        name="email"
        placeholder="Email"
        required
        className="px-3 py-2 border rounded"
      />
      <button
        type="submit"
        className="bg-black text-white px-4 py-2 rounded hover:bg-neutral-800"
      >
        Sign in with Email
      </button>
    </form>
  );
}
