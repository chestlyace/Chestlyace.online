"use client";

import { Copy, Ellipsis, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/shared/Button";
import { IconButton } from "@/components/shared/IconButton";
import { Tag } from "@/components/shared/Tag";
import type { BlogPostSummary } from "@/lib/admin/blogApi";
import { cn } from "@/lib/cn";
import { useConfirm } from "../ConfirmDialog";
import { ImportDialog } from "./ImportDialog";
import { Switch } from "../Switch";
import { useToast } from "../Toast";

type Filter = "all" | "published" | "draft";

const FILTERS: [Filter, string][] = [
  ["all", "All"],
  ["published", "Published"],
  ["draft", "Drafts"],
];

const formatDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      })
    : "Not published";

async function send(url: string, method: string, body?: unknown) {
  try {
    const response = await fetch(url, {
      method,
      headers:
        body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = (await response.json().catch(() => ({}))) as {
      item?: { id: number };
      fields?: Record<string, string>;
    };
    return { ok: response.ok, data };
  } catch {
    return {
      ok: false,
      data: {} as { item?: { id: number }; fields?: Record<string, string> },
    };
  }
}

// The Posts screen (design.md §14.19, §13.19): every post, newest first, with a
// publish switch, filter tabs and delete. Posts have no manual order, so no drag.
export function PostList({ initial }: { initial: BlogPostSummary[] }) {
  const toast = useToast();
  const confirm = useConfirm();
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [filter, setFilter] = useState<Filter>("all");
  const [importing, setImporting] = useState(false);

  const [seen, setSeen] = useState(initial);
  if (seen !== initial) {
    setSeen(initial);
    setItems(initial);
  }

  const visible = items.filter(
    (item) => filter === "all" || item.status === filter,
  );

  const toggle = async (item: BlogPostSummary, next: boolean) => {
    const status = next ? "published" : "draft";
    setItems((current) =>
      current.map((row) => (row.id === item.id ? { ...row, status } : row)),
    );
    const { ok, data } = await send(`/api/admin/blog/${item.id}`, "PATCH", {
      status,
    });
    if (ok) {
      router.refresh();
      return;
    }
    setItems((current) =>
      current.map((row) =>
        row.id === item.id ? { ...row, status: item.status } : row,
      ),
    );
    const reason = data.fields && Object.values(data.fields)[0];
    toast.error(
      reason ? `Not published: ${reason}` : "Couldn't change that. Try again.",
    );
  };

  const remove = async (item: BlogPostSummary) => {
    if (
      !(await confirm({
        title: `Delete “${item.title}”?`,
        text:
          item.status === "published"
            ? "This removes it from the blog. You can't undo this."
            : "This deletes the draft. You can't undo this.",
        confirmLabel: "Delete",
      }))
    )
      return;
    const { ok } = await send(`/api/admin/blog/${item.id}`, "DELETE");
    if (ok) {
      setItems((current) => current.filter((row) => row.id !== item.id));
      toast.success(`Deleted “${item.title}”.`);
    } else toast.error("Couldn't delete that. Try again.");
  };

  const duplicate = async (item: BlogPostSummary) => {
    const { ok, data } = await send(
      `/api/admin/blog/${item.id}/duplicate`,
      "POST",
    );
    if (ok && data.item) router.push(`/blog/${data.item.id}`);
    else toast.error("Couldn't duplicate that. Try again.");
  };

  return (
    <>
      <div
        role="tablist"
        aria-label="Posts filter"
        className="mb-6 inline-flex rounded-full bg-surface p-1"
      >
        {FILTERS.map(([value, text]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={filter === value}
            onClick={() => setFilter(value)}
            className={cn(
              "h-9 rounded-full px-4 text-sm font-medium transition-colors duration-150",
              filter === value
                ? "bg-surface-raised text-foreground shadow-sm"
                : "text-muted [@media(hover:hover)]:hover:text-foreground",
            )}
          >
            {text}
          </button>
        ))}
      </div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <p className="text-sm text-muted">
          {visible.length} {visible.length === 1 ? "post" : "posts"}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            magnetic={false}
            onClick={() => setImporting(true)}
          >
            Import from DEV
          </Button>
          <Button
            href="/blog/new"
            magnetic={false}
            trailingIcon={<Plus />}
            iconNudge="none"
          >
            New post
          </Button>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg bg-surface px-6 py-16 text-center">
          <p className="text-h3">Nothing here yet</p>
          <p className="max-w-[36ch] text-sm text-muted">
            {items.length === 0
              ? "Write the first post and it will appear here."
              : "No posts match this filter."}
          </p>
          {items.length === 0 && (
            <Button href="/blog/new" magnetic={false} className="mt-2">
              New post
            </Button>
          )}
        </div>
      ) : (
        <ul className="overflow-hidden rounded-lg bg-surface">
          {visible.map((item) => {
            const published = item.status === "published";
            const href = `/blog/${item.id}`;
            return (
              <li
                key={item.id}
                className="relative flex min-h-16 items-center gap-3 border-b border-border bg-surface px-4 py-3 last:border-b-0 [@media(hover:hover)]:hover:bg-surface-raised"
              >
                <Link href={href} className="min-w-0 flex-1 rounded-sm">
                  <span className="block truncate text-body font-medium text-foreground">
                    {item.title}
                  </span>
                  <span className="block truncate text-sm text-muted">
                    {formatDate(
                      published || item.publishedAt ? item.publishedAt : null,
                    )}
                    {item.likeCount > 0 &&
                      ` · ${item.likeCount} ${item.likeCount === 1 ? "like" : "likes"}`}
                    {item.commentCount > 0 &&
                      ` · ${item.commentCount} ${item.commentCount === 1 ? "comment" : "comments"}`}
                  </span>
                </Link>
                <span className="hidden md:block">
                  {published ? (
                    <Tag>Published</Tag>
                  ) : (
                    <Tag className="bg-transparent shadow-[inset_0_0_0_1px_var(--border)]">
                      Draft
                    </Tag>
                  )}
                  {item.french !== "none" && (
                    <Tag
                      title={
                        item.french === "live"
                          ? "French version published"
                          : "French version is a draft"
                      }
                      className={cn(
                        "ml-2",
                        item.french === "live"
                          ? "bg-primary text-primary-foreground"
                          : "bg-transparent shadow-[inset_0_0_0_1px_var(--border)]",
                      )}
                    >
                      FR
                    </Tag>
                  )}
                </span>
                <Switch
                  checked={published}
                  onChange={(next) => toggle(item, next)}
                  label={`Published: ${item.title}`}
                />
                <div className="hidden items-center md:flex">
                  <IconButton
                    label={`Edit ${item.title}`}
                    iconKey="edit"
                    onClick={() => router.push(href)}
                  >
                    <Pencil className="size-[1.125rem]" />
                  </IconButton>
                  <IconButton
                    label={`Duplicate ${item.title}`}
                    iconKey="copy"
                    onClick={() => duplicate(item)}
                  >
                    <Copy className="size-[1.125rem]" />
                  </IconButton>
                  <IconButton
                    label={`Delete ${item.title}`}
                    iconKey="delete"
                    onClick={() => remove(item)}
                    className="hover:text-danger focus-visible:text-danger"
                  >
                    <Trash2 className="size-[1.125rem]" />
                  </IconButton>
                </div>
                <RowMenu
                  title={item.title}
                  href={href}
                  onDuplicate={() => duplicate(item)}
                  onDelete={() => remove(item)}
                />
              </li>
            );
          })}
        </ul>
      )}
      {importing && (
        <ImportDialog
          onClose={() => setImporting(false)}
          onDone={() => router.refresh()}
        />
      )}
    </>
  );
}

// Below `md` the row's buttons collapse into one "More" menu.
function RowMenu({
  title,
  href,
  onDuplicate,
  onDelete,
}: {
  title: string;
  href: string;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const away = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const key = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", key);
    };
  }, [open]);

  const item =
    "flex h-11 w-full items-center gap-2 px-4 text-left text-body hover:bg-surface";
  return (
    <div ref={root} className="relative md:hidden">
      <IconButton
        label={`More: ${title}`}
        iconKey="more"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Ellipsis className="size-5" />
      </IconButton>
      {open && (
        <div className="absolute top-full right-0 z-10 mt-1 w-44 overflow-hidden rounded-md border border-border/60 bg-surface-raised py-1 shadow-float-lifted">
          <Link href={href} className={cn(item, "text-foreground")}>
            <Pencil className="size-4" aria-hidden="true" />
            Edit
          </Link>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onDuplicate();
            }}
            className={cn(item, "text-foreground")}
          >
            <Copy className="size-4" aria-hidden="true" />
            Duplicate
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
            className={cn(item, "text-danger")}
          >
            <Trash2 className="size-4" aria-hidden="true" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
