"use client";

import { Ellipsis, Eye, EyeOff, ExternalLink, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/blog/comments/Avatar";
import { IconButton } from "@/components/shared/IconButton";
import { Tag } from "@/components/shared/Tag";
import type { ModerationFilter, ModerationRow } from "@/lib/admin/commentsApi";
import { cn } from "@/lib/cn";
import { relativeTime, fullDate } from "@/lib/blog/relativeTime";
import { siteUrl } from "@/lib/sites";
import { useConfirm } from "../ConfirmDialog";
import { useToast } from "../Toast";

const TABS: [ModerationFilter, string][] = [
  ["all", "All"],
  ["reported", "Reported"],
  ["hidden", "Hidden"],
];

const EMPTY: Record<ModerationFilter, string> = {
  all: "No comments yet.",
  reported: "Nothing reported.",
  hidden: "Nothing hidden.",
};

const PROVIDERS: Record<string, string> = {
  github: "GitHub",
  google: "Google",
};

async function send(url: string, method: string, body?: unknown) {
  try {
    const response = await fetch(url, {
      method,
      headers:
        body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return response.ok;
  } catch {
    return false;
  }
}

const excerpt = (text: string) =>
  text.length > 180 ? `${text.slice(0, 177).trimEnd()}…` : text;

// The Comments screen (design.md §13.50): the readers' comments, newest first, with
// filter tabs and the owner's tools: hide or show, open on the post, delete, and in
// the "…" menu ban a reader or mark their account as the author's. Every
// destructive action asks first.
export function CommentList({ initial }: { initial: ModerationRow[] }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [filter, setFilter] = useState<ModerationFilter>("all");
  const [items, setItems] = useState(initial);
  const [loading, setLoading] = useState(false);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    let current = true;
    setTimeout(() => current && setLoading(true), 0);
    fetch(`/api/admin/blog/comments?filter=${filter}`)
      .then((response) => response.json())
      .then(
        (data: { items?: ModerationRow[] }) =>
          current && setItems(data.items ?? []),
      )
      .catch(() => current && toast.error("Couldn't load the comments."))
      .finally(() => current && setLoading(false));
    return () => {
      current = false;
    };
  }, [filter, toast]);

  const patchReader = (
    readerId: string,
    change: Partial<NonNullable<ModerationRow["reader"]>>,
  ) =>
    setItems((current) =>
      current.map((row) =>
        row.reader?.id === readerId
          ? { ...row, reader: { ...row.reader, ...change } }
          : row,
      ),
    );

  const toggle = async (row: ModerationRow) => {
    const status = row.status === "hidden" ? "visible" : "hidden";
    const ok = await send(`/api/admin/blog/comments/${row.id}`, "PATCH", {
      status,
    });
    if (!ok) return toast.error("Couldn't change that. Try again.");
    setItems((current) =>
      filter === "hidden" && status === "visible"
        ? current.filter((item) => item.id !== row.id)
        : current.map((item) =>
            item.id === row.id ? { ...item, status } : item,
          ),
    );
    toast.success(
      status === "hidden"
        ? "Hidden from the post."
        : "Shown on the post again.",
    );
  };

  const remove = async (row: ModerationRow) => {
    if (
      !(await confirm({
        title: "Delete this comment?",
        text:
          row.replies > 0
            ? `It is removed for good, and its ${row.replies === 1 ? "reply goes" : `${row.replies} replies go`} with it. You can't undo this.`
            : "It is removed for good. You can't undo this.",
        confirmLabel: "Delete",
      }))
    )
      return;
    if (!(await send(`/api/admin/blog/comments/${row.id}`, "DELETE")))
      return toast.error("Couldn't delete that. Try again.");
    setItems((current) =>
      current.filter((item) => item.id !== row.id && item.parentId !== row.id),
    );
    toast.success("Comment deleted.");
  };

  const ban = async (row: ModerationRow) => {
    const reader = row.reader!;
    const banning = !reader.banned;
    if (
      banning &&
      !(await confirm({
        title: `Ban ${reader.name}?`,
        text: "They can no longer comment. Their existing comments stay until you hide or delete them.",
        confirmLabel: "Ban reader",
      }))
    )
      return;
    if (
      !(await send(`/api/admin/blog/readers/${reader.id}`, "PATCH", {
        banned: banning,
      }))
    )
      return toast.error("Couldn't change that. Try again.");
    patchReader(reader.id, { banned: banning });
    toast.success(
      banning
        ? `${reader.name} is banned.`
        : `${reader.name} can comment again.`,
    );
  };

  const author = async (row: ModerationRow) => {
    const reader = row.reader!;
    const marking = !reader.isAuthor;
    if (
      marking &&
      !(await confirm({
        title: `Mark ${reader.name} as the author?`,
        text: "Their comments show the AUTHOR tag. Only mark your own account.",
        confirmLabel: "Mark as author",
        tone: "primary",
      }))
    )
      return;
    if (
      !(await send(`/api/admin/blog/readers/${reader.id}`, "PATCH", {
        isAuthor: marking,
      }))
    )
      return toast.error("Couldn't change that. Try again.");
    patchReader(reader.id, { isAuthor: marking });
    toast.success(
      marking ? "Marked as the author." : "No longer marked as the author.",
    );
  };

  return (
    <>
      <div
        role="tablist"
        aria-label="Comments filter"
        className="mb-6 inline-flex rounded-full bg-surface p-1"
      >
        {TABS.map(([value, text]) => (
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
      <p className="mb-6 text-sm text-muted" aria-live="polite">
        {loading
          ? "Loading…"
          : `${items.length} ${items.length === 1 ? "comment" : "comments"}`}
      </p>

      {items.length === 0 ? (
        <div className="rounded-lg bg-surface px-6 py-16 text-center">
          <p className="text-h3">{EMPTY[filter]}</p>
        </div>
      ) : (
        <ul className="overflow-hidden rounded-lg bg-surface">
          {items.map((row) => (
            <Row
              key={row.id}
              row={row}
              onToggle={() => toggle(row)}
              onDelete={() => remove(row)}
              onBan={() => ban(row)}
              onAuthor={() => author(row)}
            />
          ))}
        </ul>
      )}
    </>
  );
}

function Row({
  row,
  onToggle,
  onDelete,
  onBan,
  onAuthor,
}: {
  row: ModerationRow;
  onToggle: () => void;
  onDelete: () => void;
  onBan: () => void;
  onAuthor: () => void;
}) {
  const name = row.reader?.name ?? "Deleted user";
  const hidden = row.status === "hidden";
  const url = siteUrl("blog", `/${row.post.slug}#comments`);
  return (
    <li className="flex items-start gap-3 border-b border-border px-4 py-4 last:border-b-0 [@media(hover:hover)]:hover:bg-surface-raised">
      <Avatar name={name} image={row.reader?.image ?? null} size={36} />
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <span className="font-semibold text-foreground">{name}</span>
          {row.reader?.provider && (
            <span className="text-muted">
              {PROVIDERS[row.reader.provider] ?? row.reader.provider}
            </span>
          )}
          {row.reader?.isAuthor && <Tag>AUTHOR</Tag>}
          {row.reader?.banned && (
            <Tag className="bg-danger/10 text-danger">Banned</Tag>
          )}
          {hidden && (
            <Tag className="bg-transparent shadow-[inset_0_0_0_1px_var(--border)]">
              Hidden
            </Tag>
          )}
          {row.reports > 0 && (
            <Tag className="bg-danger/10 text-danger">
              Reported ×{row.reports}
            </Tag>
          )}
          <time
            dateTime={row.createdAt}
            title={fullDate(row.createdAt)}
            className="text-muted"
          >
            {relativeTime(row.createdAt)}
          </time>
        </p>
        <p className="mt-1 text-body break-words whitespace-pre-wrap text-foreground">
          {excerpt(row.body)}
        </p>
        <p className="mt-1 text-sm text-muted">
          {row.parentId ? "Reply on " : "On "}
          <a
            href={url}
            target="_blank"
            rel="noopener"
            className="link-inline text-foreground"
          >
            {row.post.title}
          </a>
        </p>
      </div>
      <div className="flex shrink-0 items-center">
        <IconButton
          label={hidden ? "Show this comment" : "Hide this comment"}
          iconKey={hidden ? "show" : "hide"}
          onClick={onToggle}
        >
          {hidden ? (
            <Eye className="size-[1.125rem]" />
          ) : (
            <EyeOff className="size-[1.125rem]" />
          )}
        </IconButton>
        <span className="hidden md:inline-flex">
          <IconButton
            label="Open on the post"
            iconKey="open"
            onClick={() => window.open(url, "_blank", "noopener")}
          >
            <ExternalLink className="size-[1.125rem]" />
          </IconButton>
        </span>
        <IconButton
          label="Delete this comment"
          iconKey="delete"
          onClick={onDelete}
          className="hover:text-danger focus-visible:text-danger"
        >
          <Trash2 className="size-[1.125rem]" />
        </IconButton>
        <MoreMenu row={row} url={url} onBan={onBan} onAuthor={onAuthor} />
      </div>
    </li>
  );
}

function MoreMenu({
  row,
  url,
  onBan,
  onAuthor,
}: {
  row: ModerationRow;
  url: string;
  onBan: () => void;
  onAuthor: () => void;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const key = (event: globalThis.KeyboardEvent) =>
      event.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", key);
    };
  }, [open]);

  const reader = row.reader;
  const item =
    "flex h-11 w-full items-center gap-2 px-4 text-left text-body text-foreground hover:bg-surface disabled:opacity-40";
  return (
    <div ref={root} className="relative">
      <IconButton
        label="More actions"
        iconKey="more"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Ellipsis className="size-5" />
      </IconButton>
      {open && (
        <div
          role="menu"
          className="absolute top-full right-0 z-10 mt-1 w-60 overflow-hidden rounded-md border border-border/60 bg-surface-raised py-1 shadow-float-lifted"
        >
          <a
            role="menuitem"
            href={url}
            target="_blank"
            rel="noopener"
            className={cn(item, "md:hidden")}
          >
            Open on the post
          </a>
          <button
            type="button"
            role="menuitem"
            disabled={!reader}
            onClick={() => {
              setOpen(false);
              onBan();
            }}
            className={cn(item, reader && !reader.banned && "text-danger")}
          >
            {reader?.banned ? "Unban reader" : "Ban reader"}
          </button>
          <button
            type="button"
            role="menuitem"
            disabled={!reader}
            onClick={() => {
              setOpen(false);
              onAuthor();
            }}
            className={item}
          >
            {reader?.isAuthor
              ? "Unmark as the author"
              : "Mark this account as the author"}
          </button>
        </div>
      )}
    </div>
  );
}
