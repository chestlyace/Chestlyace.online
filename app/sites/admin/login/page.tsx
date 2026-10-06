import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/LoginForm";
import { Brand } from "@/components/shared/Brand";
import { hasSession } from "@/lib/admin/auth";
import { safeNext } from "@/lib/admin/request";

export const metadata: Metadata = { title: "Sign in" };

const NOTES: Record<string, string> = {
  "signed-out": "You've been signed out.",
  expired: "Your session ended. Sign in again.",
};

// The sign-in screen (design.md §13.26).
export default async function LoginPage({
  searchParams,
}: PageProps<"/sites/admin/login">) {
  const params = await searchParams;
  const first = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;
  const next = safeNext(first(params.next));
  const reason = first(params.reason);

  if (await hasSession()) redirect(next);

  return (
    <main
      id="main"
      tabIndex={-1}
      className="flex min-h-dvh items-center justify-center px-4 py-12 outline-none"
    >
      <div className="w-full max-w-[25rem] rounded-xl bg-surface p-8 motion-safe:animate-[admin-card-in_300ms_var(--ease-out)]">
        <Brand />
        <p className="type-label mt-6 text-muted">Admin</p>
        <h1 className="mt-1 mb-6 text-title text-foreground">Sign in</h1>
        {reason && NOTES[reason] && (
          <p role="status" className="mb-5 text-sm text-muted">
            {NOTES[reason]}
          </p>
        )}
        <LoginForm next={next} />
      </div>
    </main>
  );
}
