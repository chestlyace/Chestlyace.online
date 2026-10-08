"use client";

import { CircleAlert } from "lucide-react";
import { useState } from "react";
import { siGithub, siGoogle } from "simple-icons";
import { Button } from "@/components/shared/Button";
import { TextLink } from "@/components/shared/TextLink";
import { authClient } from "@/lib/blog/authClient";
import type { ProviderId } from "@/lib/blog/auth";
import { cn } from "@/lib/cn";
import { Dialog } from "./Dialog";

const PROVIDERS: Record<ProviderId, { label: string; path: string }> = {
  github: { label: "Continue with GitHub", path: siGithub.path },
  google: { label: "Continue with Google", path: siGoogle.path },
};

// The sign-in panel (design.md §13.36): the two provider buttons and a line about
// what is used. The reader comes back to this post, at the comments, after signing in.
export function SignInPanel({
  providers,
  failed,
  className,
}: {
  providers: ProviderId[];
  failed: boolean;
  className?: string;
}) {
  const [starting, setStarting] = useState<ProviderId | null>(null);
  const [error, setError] = useState(false);

  const start = async (provider: ProviderId) => {
    setStarting(provider);
    setError(false);
    const here = window.location.pathname;
    const result = await authClient.signIn.social({
      provider,
      callbackURL: `${here}#comments`,
      errorCallbackURL: `${here}?signin=failed#comments`,
    });
    // On success the browser is already on its way to the provider.
    if (result?.error) {
      setStarting(null);
      setError(true);
    }
  };

  return (
    <div className={cn("rounded-lg bg-surface p-6", className)}>
      <h3 className="text-h3">Sign in to comment</h3>
      <p className="mt-2 text-sm text-muted">
        We use your name and picture from GitHub or Google. Your email is never
        shown.{" "}
        <TextLink href="/privacy" variant="inline">
          Privacy
        </TextLink>
      </p>
      {(failed || error) && (
        <p
          role="alert"
          className="mt-4 flex items-start gap-2 text-sm text-danger"
        >
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          Sign-in didn&apos;t complete. Please try again.
        </p>
      )}
      {providers.length === 0 ? (
        <p className="mt-4 text-sm text-muted">
          Sign-in isn&apos;t available yet.
        </p>
      ) : (
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          {providers.map((provider) => (
            <Button
              key={provider}
              variant="secondary"
              magnetic={false}
              loading={starting === provider}
              disabled={starting !== null}
              onClick={() => void start(provider)}
            >
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
                className="size-[18px]"
              >
                <path d={PROVIDERS[provider].path} />
              </svg>
              {PROVIDERS[provider].label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

// The same panel in a dialog, for a signed-out reader who tries to like or reply.
export function SignInDialog({
  providers,
  onClose,
}: {
  providers: ProviderId[];
  onClose: () => void;
}) {
  return (
    <Dialog title="Sign in to comment" onClose={onClose}>
      <SignInPanel providers={providers} failed={false} className="p-0" />
    </Dialog>
  );
}
