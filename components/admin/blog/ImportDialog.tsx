"use client";

import { CircleAlert, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useId, useState } from "react";
import { Button } from "@/components/shared/Button";
import { FormField, fieldControl } from "@/components/shared/FormField";
import { Tag } from "@/components/shared/Tag";
import type { ImportReport, FoundArticle } from "@/lib/admin/devtoApi";
import { cn } from "@/lib/cn";
import { Dialog } from "./Dialog";

const STORE = "chestly.devto.username";

function remembered(): string {
  try {
    return window.localStorage.getItem(STORE) ?? "";
  } catch {
    return "";
  }
}

async function post<T>(
  url: string,
  body: unknown,
): Promise<{ ok: true; data: T } | { ok: false; message: string }> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await response.json().catch(() => ({}))) as T & {
      message?: string;
    };
    return response.ok
      ? { ok: true, data }
      : {
          ok: false,
          message: data.message ?? "Something went wrong. Try again.",
        };
  } catch {
    return {
      ok: false,
      message: "Couldn't reach the server. Check your connection.",
    };
  }
}

const formatDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      })
    : "";

// "Import from DEV" (design.md §13.49): find your articles, choose, import them as
// drafts, and read what became what. Reading published articles needs no key.
export function ImportDialog({
  onClose,
  onDone,
}: {
  onClose: () => void;
  onDone: () => void;
}) {
  const id = useId();
  const [username, setUsername] = useState(remembered);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [articles, setArticles] = useState<FoundArticle[] | null>(null);
  const [chosen, setChosen] = useState<Set<number>>(new Set());
  const [reports, setReports] = useState<ImportReport[] | null>(null);

  const find = async () => {
    setLoading(true);
    setError(null);
    const result = await post<{ items: FoundArticle[] }>(
      "/api/admin/blog/devto/find",
      { username },
    );
    setLoading(false);
    if (!result.ok) return setError(result.message);
    try {
      window.localStorage.setItem(STORE, username.trim().replace(/^@/, ""));
    } catch {}
    setArticles(result.data.items);
    setChosen(new Set());
  };

  const importable = (articles ?? []).filter((article) => !article.imported);

  const run = async () => {
    setLoading(true);
    setError(null);
    const result = await post<{ items: ImportReport[] }>(
      "/api/admin/blog/devto/import",
      { ids: [...chosen] },
    );
    setLoading(false);
    if (!result.ok) return setError(result.message);
    setReports(result.data.items);
    onDone();
  };

  return (
    <Dialog title="Import from DEV" onClose={onClose}>
      {error && (
        <p
          role="alert"
          className="mb-4 flex items-start gap-2 rounded-lg bg-surface p-3 text-sm text-danger"
        >
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}

      {reports ? (
        <>
          <p className="mb-3 text-sm text-muted">
            {reports.filter((r) => r.status === "imported").length} imported as
            drafts. Nothing is published; open each draft to review it.
          </p>
          <ul aria-label="Import report" className="grid gap-3">
            {reports.map((report) => (
              <li key={report.devId} className="rounded-lg bg-surface p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium text-foreground">
                    {report.title || `Article ${report.devId}`}
                  </p>
                  {report.postId && report.status === "imported" && (
                    <Link
                      href={`/blog/${report.postId}`}
                      className="link-inline flex shrink-0 items-center gap-1 text-sm"
                    >
                      Open the draft
                      <ExternalLink className="size-3.5" aria-hidden="true" />
                    </Link>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted">
                  {report.status === "imported"
                    ? "Imported as a draft."
                    : report.status === "skipped"
                      ? "Already imported; left as it is."
                      : "Not imported."}
                </p>
                {report.error && (
                  <p className="mt-1 text-sm text-danger">{report.error}</p>
                )}
                {report.notes.length > 0 && (
                  <ul className="mt-2 list-disc pl-5 text-sm text-foreground">
                    {report.notes.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                )}
                {report.warnings.length > 0 && (
                  <ul aria-label="Warnings" className="mt-2 grid gap-1 text-sm">
                    {report.warnings.map((warning) => (
                      <li key={warning} className="flex gap-2 text-foreground">
                        <CircleAlert
                          className="mt-0.5 size-4 shrink-0 text-danger"
                          aria-hidden="true"
                        />
                        {warning}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
          <div className="mt-5 flex justify-end">
            <Button magnetic={false} onClick={onClose}>
              Done
            </Button>
          </div>
        </>
      ) : articles === null ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (username.trim()) void find();
          }}
        >
          <FormField
            id={`${id}-user`}
            label="Your DEV username"
            helper="Reading your published articles needs no key."
          >
            <input
              id={`${id}-user`}
              value={username}
              autoComplete="off"
              placeholder="e.g. chestlyace"
              onChange={(event) => setUsername(event.target.value)}
              className={cn(fieldControl, "h-12 px-4")}
            />
          </FormField>
          <div className="mt-5 flex justify-end">
            <Button
              type="submit"
              magnetic={false}
              loading={loading}
              disabled={!username.trim()}
            >
              Find my posts
            </Button>
          </div>
        </form>
      ) : articles.length === 0 ? (
        <>
          <p className="text-sm text-muted">
            DEV has no published articles for that username.
          </p>
          <div className="mt-5 flex justify-end">
            <Button
              variant="ghost"
              magnetic={false}
              onClick={() => setArticles(null)}
            >
              Try another username
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm text-muted">
              {articles.length} {articles.length === 1 ? "article" : "articles"}
              ; {chosen.size} chosen.
            </p>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={
                  importable.length > 0 && chosen.size === importable.length
                }
                disabled={importable.length === 0}
                onChange={(event) =>
                  setChosen(
                    event.target.checked
                      ? new Set(importable.map((a) => a.id))
                      : new Set(),
                  )
                }
                className="size-4 accent-primary"
              />
              Select all
            </label>
          </div>
          <ul
            aria-label="Your DEV articles"
            className="max-h-[22rem] overflow-y-auto rounded-lg bg-surface"
          >
            {articles.map((article) => (
              <li
                key={article.id}
                className="border-b border-border last:border-b-0"
              >
                <label
                  className={cn(
                    "flex cursor-pointer items-center gap-3 p-3",
                    article.imported && "opacity-60",
                  )}
                >
                  <input
                    type="checkbox"
                    disabled={article.imported}
                    checked={chosen.has(article.id)}
                    onChange={(event) =>
                      setChosen((now) => {
                        const next = new Set(now);
                        if (event.target.checked) next.add(article.id);
                        else next.delete(article.id);
                        return next;
                      })
                    }
                    className="size-5 shrink-0 accent-primary"
                  />
                  {article.cover ? (
                    // eslint-disable-next-line @next/next/no-img-element -- DEV's own image address
                    <img
                      src={article.cover}
                      alt=""
                      loading="lazy"
                      className="h-10 w-16 shrink-0 rounded-sm bg-tile object-cover"
                    />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="h-10 w-16 shrink-0 rounded-sm bg-tile"
                    />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-body font-medium text-foreground">
                      {article.title}
                    </span>
                    <span className="block truncate text-sm text-muted">
                      {formatDate(article.publishedAt)}
                      {article.tags.length > 0 &&
                        ` · ${article.tags.join(", ")}`}
                    </span>
                  </span>
                  {article.imported && <Tag>Already imported</Tag>}
                </label>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex justify-end gap-3">
            <Button
              variant="ghost"
              magnetic={false}
              onClick={() => setArticles(null)}
            >
              Back
            </Button>
            <Button
              magnetic={false}
              loading={loading}
              disabled={chosen.size === 0}
              onClick={run}
            >
              Import {chosen.size > 0 ? chosen.size : ""} as{" "}
              {chosen.size === 1 ? "a draft" : "drafts"}
            </Button>
          </div>
        </>
      )}
    </Dialog>
  );
}
