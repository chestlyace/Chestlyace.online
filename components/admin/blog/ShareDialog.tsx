"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/shared/Button";
import { useConfirm } from "@/components/admin/ConfirmDialog";
import { useToast } from "@/components/admin/Toast";
import type { ShareLink } from "@/lib/admin/shareApi";
import { relativeTime } from "@/lib/blog/relativeTime";
import { cn } from "@/lib/cn";
import { siteUrl } from "@/lib/sites";
import { Dialog } from "./Dialog";

/** The address a share link opens, in English or French. */
export function shareUrl(token: string, lang: "en" | "fr" = "en"): string {
  return siteUrl("blog", `${lang === "fr" ? "/fr" : ""}/drafts/${token}`);
}

// Turning sharing on for a draft, copying the link, making a new one, turning it off
// (design.md §13.70, D93). The link always shows the last saved version; creating it
// saves the post first (`beforeCreate`).
export function ShareDialog({
  postId,
  share,
  hasFrench,
  beforeCreate,
  onChange,
  onClose,
}: {
  postId: number;
  share: ShareLink | null;
  /** Whether the post has a published French version (the French link is offered). */
  hasFrench: boolean;
  /** Saves unsaved changes; false stops the link from being made. */
  beforeCreate: () => Promise<boolean>;
  onChange: (share: ShareLink | null) => void;
  onClose: () => void;
}) {
  const toast = useToast();
  const confirm = useConfirm();
  const [busy, setBusy] = useState<"create" | "renew" | "off" | null>(null);
  const [lang, setLang] = useState<"en" | "fr">("en");
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const send = async (
    kind: "create" | "renew" | "off",
  ): Promise<ShareLink | null | undefined> => {
    setBusy(kind);
    try {
      const response = await fetch(`/api/admin/blog/${postId}/share`, {
        method: kind === "off" ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: kind === "renew" ? JSON.stringify({ renew: true }) : undefined,
      });
      const result = (await response.json().catch(() => ({}))) as {
        share?: ShareLink | null;
        fields?: Record<string, string>;
      };
      if (response.ok && result.share !== undefined) return result.share;
      toast.error(
        result.fields?._ ?? "Couldn't change the share link. Try again.",
      );
    } catch {
      toast.error("Couldn't change the share link. Try again.");
    } finally {
      setBusy(null);
    }
    return undefined;
  };

  const create = async () => {
    if (!(await beforeCreate())) return;
    const next = await send("create");
    if (next !== undefined) onChange(next);
  };

  const renew = async () => {
    if (
      !(await confirm({
        title: "Make a new link?",
        text: "The current link will stop working.",
        confirmLabel: "New link",
        tone: "primary",
      }))
    )
      return;
    const next = await send("renew");
    if (next !== undefined) {
      onChange(next);
      toast.success("New link made. The old one no longer works.");
    }
  };

  const turnOff = async () => {
    if (
      !(await confirm({
        title: "Turn off sharing?",
        text: "The link will stop working. Feedback already sent is kept.",
        confirmLabel: "Turn off",
      }))
    )
      return;
    const next = await send("off");
    if (next !== undefined) {
      onChange(null);
      toast.success("Sharing is off.");
    }
  };

  const url = share ? shareUrl(share.token, hasFrench ? lang : "en") : "";
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      return;
    }
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog title="Share this draft" onClose={onClose}>
      <p className="text-sm text-muted">
        Anyone with the link can read this draft. It isn&rsquo;t listed anywhere
        or shown to search engines.
      </p>

      {share ? (
        <div className="mt-6 grid gap-3">
          {hasFrench && (
            <div
              role="radiogroup"
              aria-label="Link language"
              className="inline-flex w-fit rounded-full bg-surface p-1"
            >
              {(
                [
                  ["en", "English"],
                  ["fr", "Français"],
                ] as const
              ).map(([code, name]) => (
                <button
                  key={code}
                  type="button"
                  role="radio"
                  aria-checked={lang === code}
                  onClick={() => setLang(code)}
                  className={cn(
                    "h-9 rounded-full px-4 text-sm font-medium transition-colors duration-150",
                    lang === code
                      ? "bg-surface-raised text-foreground shadow-sm"
                      : "text-muted [@media(hover:hover)]:hover:text-foreground",
                  )}
                >
                  {name}
                </button>
              ))}
            </div>
          )}
          <label htmlFor="share-link" className="text-sm font-medium">
            Share link
          </label>
          <div className="flex items-center gap-2">
            <input
              id="share-link"
              readOnly
              value={url}
              onFocus={(event) => event.currentTarget.select()}
              className="h-11 min-w-0 flex-1 rounded-sm bg-tile px-3 font-mono text-[0.8125rem] text-foreground shadow-[inset_0_0_0_1px_var(--border)] outline-none focus-visible:outline-2 focus-visible:outline-ring"
            />
            <Button
              variant="secondary"
              size="sm"
              magnetic={false}
              onClick={() => void copy()}
              trailingIcon={copied ? <Check /> : <Copy />}
              iconNudge="none"
            >
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <p className="text-sm text-muted">
            Created{" "}
            <time dateTime={share.createdAt}>
              {relativeTime(share.createdAt)}
            </time>
          </p>
          <p aria-live="polite" className="sr-only">
            {copied ? "Link copied" : ""}
          </p>
        </div>
      ) : (
        <div className="mt-6">
          <Button
            magnetic={false}
            loading={busy === "create"}
            onClick={() => void create()}
          >
            Create link
          </Button>
        </div>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-end gap-3">
        {share && (
          <>
            <Button
              variant="ghost"
              magnetic={false}
              loading={busy === "off"}
              disabled={busy !== null}
              onClick={() => void turnOff()}
              className="mr-auto !text-danger"
            >
              Turn off sharing
            </Button>
            <Button
              variant="secondary"
              magnetic={false}
              loading={busy === "renew"}
              disabled={busy !== null}
              onClick={() => void renew()}
            >
              New link
            </Button>
          </>
        )}
        <Button variant="ghost" magnetic={false} onClick={onClose}>
          Close
        </Button>
      </div>
    </Dialog>
  );
}
