"use client";

import { CircleAlert, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/shared/Button";
import { fieldControl } from "@/components/shared/FormField";
import { IconButton } from "@/components/shared/IconButton";
import { cn } from "@/lib/cn";

const MESSAGES = {
  invalid: "That password isn't right.",
  failed: "Couldn't sign in. Check your connection and try again.",
  notConfigured:
    "The admin isn't set up yet: ADMIN_PASSWORD_HASH and SESSION_SECRET are missing on the server.",
} as const;

function waitText(seconds: number) {
  const minutes = Math.max(1, Math.ceil(seconds / 60));
  return `Too many attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`;
}

// The sign-in form (design.md §13.26): one password, no username. A wrong
// password gets one message that says nothing about why; after too many
// attempts the form waits out the time the server asks for.
export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [shown, setShown] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy || locked) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, next }),
      });
      const body = (await response.json().catch(() => ({}))) as {
        next?: string;
        retryAfterSeconds?: number;
      };
      if (response.ok) {
        router.replace(body.next ?? "/");
        router.refresh();
        return;
      }
      if (response.status === 401) {
        setError(MESSAGES.invalid);
        input.current?.focus();
      } else if (response.status === 429) {
        const seconds = body.retryAfterSeconds ?? 60;
        setError(waitText(seconds));
        setLocked(true);
        window.setTimeout(() => setLocked(false), seconds * 1000);
      } else if (response.status === 503) {
        setError(MESSAGES.notConfigured);
      } else {
        setError(MESSAGES.failed);
      }
    } catch {
      setError(MESSAGES.failed);
    }
    setBusy(false);
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <div>
        <label
          htmlFor="admin-password"
          className="mb-2 block text-sm font-medium text-foreground"
        >
          Password
        </label>
        <div className="relative">
          <input
            ref={input}
            id="admin-password"
            name="password"
            type={shown ? "text" : "password"}
            autoComplete="current-password"
            autoFocus
            required
            value={password}
            disabled={locked}
            onChange={(event) => setPassword(event.target.value)}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "admin-password-error" : undefined}
            className={cn(fieldControl, "h-12 pr-14 pl-4")}
          />
          <div className="absolute top-1/2 right-1 -translate-y-1/2">
            <IconButton
              label={shown ? "Hide password" : "Show password"}
              iconKey={shown ? "hide" : "show"}
              onClick={() => setShown((value) => !value)}
            >
              {shown ? (
                <EyeOff className="size-5" />
              ) : (
                <Eye className="size-5" />
              )}
            </IconButton>
          </div>
        </div>
        {error && (
          <p
            id="admin-password-error"
            role="alert"
            className="flex items-start gap-1.5 pt-2 text-sm text-danger"
          >
            <CircleAlert
              className="mt-0.5 size-3.5 shrink-0"
              aria-hidden="true"
            />
            <span>{error}</span>
          </p>
        )}
      </div>
      <Button
        type="submit"
        size="lg"
        magnetic={false}
        loading={busy}
        disabled={locked || password.length === 0}
        className="w-full"
      >
        Sign in
      </Button>
    </form>
  );
}
