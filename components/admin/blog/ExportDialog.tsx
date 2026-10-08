"use client";

import { CircleAlert, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/shared/Button";
import { exportChanges } from "@/lib/blog/devtoExport";
import { Switch } from "../Switch";
import { Dialog } from "./Dialog";

// "Publish to DEV" (design.md §13.49): what will change, the options, and the
// result. Nothing is sent without pressing the primary button.
export function ExportDialog({
  id,
  markdown,
  linked,
  postStatus,
  onClose,
  onSent,
}: {
  id: number;
  /** The saved post's markdown. */
  markdown: string;
  /** The DEV address this post is already linked to, if any. */
  linked: string | null;
  postStatus: "draft" | "published";
  onClose: () => void;
  onSent: (url: string) => void;
}) {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [publish, setPublish] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ message: string; gone: boolean } | null>(
    null,
  );
  const [done, setDone] = useState<{ url: string; created: boolean } | null>(
    null,
  );
  const changes = exportChanges(markdown);

  useEffect(() => {
    let current = true;
    fetch("/api/admin/blog/devto/status")
      .then((response) => response.json())
      .then(
        (data: { configured?: boolean }) =>
          current && setConfigured(Boolean(data.configured)),
      )
      .catch(() => current && setConfigured(false));
    return () => {
      current = false;
    };
  }, []);

  const send = async (fresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/blog/${id}/devto`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publish, ...(fresh ? { fresh: true } : {}) }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        url?: string;
        created?: boolean;
        message?: string;
      };
      if (response.ok && data.url) {
        setDone({ url: data.url, created: Boolean(data.created) });
        onSent(data.url);
      } else
        setError({
          message: data.message ?? "DEV didn't accept it.",
          gone: response.status === 409,
        });
    } catch {
      setError({
        message: "Couldn't reach the server. Check your connection.",
        gone: false,
      });
    }
    setLoading(false);
  };

  return (
    <Dialog title="Publish to DEV" onClose={onClose}>
      {done ? (
        <>
          <p role="status" className="text-body text-foreground">
            {done.created ? "Sent to DEV." : "DEV's article is updated."}{" "}
            {publish
              ? "It is published there."
              : "It is a draft there, so you can look it over first."}
          </p>
          <p className="mt-3">
            <a
              href={done.url}
              target="_blank"
              rel="noopener"
              className="link-inline inline-flex items-center gap-1"
            >
              Open it on DEV
              <ExternalLink className="size-4" aria-hidden="true" />
            </a>
          </p>
          <div className="mt-5 flex justify-end">
            <Button magnetic={false} onClick={onClose}>
              Done
            </Button>
          </div>
        </>
      ) : (
        <>
          <section
            aria-label="Status"
            className="mb-5 rounded-lg bg-surface p-4 text-sm"
          >
            {configured === null ? (
              <p className="text-muted">Checking the DEV API key…</p>
            ) : configured ? (
              <p className="text-foreground">
                The DEV API key is set on the server.
              </p>
            ) : (
              <div className="grid gap-2 text-foreground">
                <p className="font-medium">The DEV API key isn&apos;t set.</p>
                <ol className="list-decimal pl-5 text-muted">
                  <li>
                    In DEV, open Settings → Extensions and generate an API key.
                  </li>
                  <li>
                    In Vercel, add it to the project&apos;s environment
                    variables as{" "}
                    <code className="font-mono">DEVTO_API_KEY</code>, and
                    redeploy.
                  </li>
                </ol>
              </div>
            )}
          </section>

          <section aria-label="What will change" className="mb-5">
            <h3 className="mb-2 text-body font-semibold text-foreground">
              What will change
            </h3>
            {changes.length === 0 ? (
              <p className="text-sm text-muted">
                The post is plain markdown, so it goes across as it is.
              </p>
            ) : (
              <ul className="grid gap-1.5 text-sm">
                {changes.map((change) => (
                  <li key={change.name} className="text-foreground">
                    <span className="font-medium">
                      {change.name}
                      {change.count > 1 ? ` ×${change.count}` : ""}
                    </span>{" "}
                    <span className="text-muted">
                      becomes {change.written}.
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-2 text-sm text-muted">
              The article&apos;s canonical address is this post, and it ends
              with &ldquo;Originally published at&rdquo;.
              {linked
                ? " It is already on DEV, so that article is updated."
                : ""}
            </p>
            {postStatus === "draft" && (
              <p className="mt-2 text-sm text-muted">
                This post isn&apos;t published here yet, so its canonical link
                won&apos;t work until it is.
              </p>
            )}
          </section>

          <div className="mb-5 flex items-start justify-between gap-6 rounded-lg bg-surface p-4">
            <div>
              <p className="text-sm font-medium text-foreground">Publish now</p>
              <p className="mt-0.5 text-sm text-muted">
                Off: it is created as a draft on DEV.
              </p>
            </div>
            <Switch
              checked={publish}
              onChange={setPublish}
              label="Publish now on DEV"
            />
          </div>

          {error && (
            <div
              role="alert"
              className="mb-4 flex items-start gap-2 rounded-lg bg-surface p-3 text-sm text-danger"
            >
              <CircleAlert
                className="mt-0.5 size-4 shrink-0"
                aria-hidden="true"
              />
              <div>
                <p>{error.message}</p>
                {error.gone && (
                  <button
                    type="button"
                    onClick={() => void send(true)}
                    className="link-inline mt-1 text-foreground"
                  >
                    Create a new article instead
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button variant="ghost" magnetic={false} onClick={onClose}>
              Cancel
            </Button>
            <Button
              magnetic={false}
              loading={loading}
              disabled={!configured}
              onClick={() => void send()}
            >
              {linked
                ? "Update on DEV"
                : publish
                  ? "Publish on DEV"
                  : "Send as a draft"}
            </Button>
          </div>
        </>
      )}
    </Dialog>
  );
}
