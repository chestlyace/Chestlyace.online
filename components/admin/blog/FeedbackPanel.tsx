"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/shared/Button";
import { IconButton } from "@/components/shared/IconButton";
import { Tag } from "@/components/shared/Tag";
import { useConfirm } from "@/components/admin/ConfirmDialog";
import { useToast } from "@/components/admin/Toast";
import { pieces } from "@/lib/blog/commentText";
import type { Feedback } from "@/lib/blog/draftFeedback";
import { fullDate, relativeTime } from "@/lib/blog/relativeTime";
import { cn } from "@/lib/cn";

// The feedback sent on a shared draft (design.md §13.71, D93), newest first. Opening
// the tab marks nothing read: an item is read when the owner clicks it, or with
// "Mark all as read", so nothing is missed.
export function FeedbackPanel({
  postId,
  items,
  onChange,
  onShare,
}: {
  postId: number;
  items: Feedback[];
  onChange: (items: Feedback[]) => void;
  /** Opens the Share dialog (from the empty state). */
  onShare: () => void;
}) {
  const toast = useToast();
  const confirm = useConfirm();
  const unread = items.filter((item) => !item.readAt).length;

  const markRead = async (body: { ids: number[] } | { all: true }) => {
    const now = new Date().toISOString();
    const ids = "ids" in body ? new Set(body.ids) : null;
    const before = items;
    onChange(
      items.map((item) =>
        !item.readAt && (!ids || ids.has(item.id))
          ? { ...item, readAt: now }
          : item,
      ),
    );
    const response = await fetch(`/api/admin/blog/${postId}/feedback`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch(() => null);
    if (!response?.ok) {
      onChange(before);
      toast.error("Couldn't mark that as read. Try again.");
    }
  };

  const remove = async (item: Feedback) => {
    if (
      !(await confirm({
        title: `Delete the feedback from ${item.name}?`,
        text: "You can't undo this.",
        confirmLabel: "Delete",
      }))
    )
      return;
    const response = await fetch(
      `/api/admin/blog/${postId}/feedback/${item.id}`,
      { method: "DELETE" },
    ).catch(() => null);
    if (response?.ok) {
      onChange(items.filter((other) => other.id !== item.id));
      toast.success("Feedback deleted.");
    } else toast.error("Couldn't delete that. Try again.");
  };

  if (items.length === 0)
    return (
      <section aria-label="Feedback" className="rounded-lg bg-surface p-6">
        <p className="text-sm text-muted">
          No feedback yet. Share the draft to get some.
        </p>
        <Button
          variant="secondary"
          size="sm"
          magnetic={false}
          className="mt-4"
          onClick={onShare}
        >
          Share
        </Button>
      </section>
    );

  return (
    <section aria-label="Feedback">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {items.length} {items.length === 1 ? "note" : "notes"}
          {unread > 0 && ` · ${unread} unread`}
        </p>
        {unread > 0 && (
          <Button
            variant="ghost"
            size="sm"
            magnetic={false}
            onClick={() => void markRead({ all: true })}
          >
            Mark all as read
          </Button>
        )}
      </div>
      <ul className="grid gap-3">
        {items.map((item) => (
          <li key={item.id}>
            <article
              aria-label={item.name}
              onClick={(event) => {
                if ((event.target as HTMLElement).closest("a, button")) return;
                if (!item.readAt) void markRead({ ids: [item.id] });
              }}
              className={cn(
                "rounded-lg bg-surface p-4",
                !item.readAt && "cursor-pointer",
              )}
            >
              <header className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2">
                    {!item.readAt && (
                      <span
                        className="size-2 shrink-0 rounded-full bg-primary"
                        title="Unread"
                      >
                        <span className="sr-only">Unread</span>
                      </span>
                    )}
                    <span className="font-semibold text-foreground">
                      {item.name}
                    </span>
                    <time
                      dateTime={item.createdAt}
                      title={fullDate(item.createdAt)}
                      suppressHydrationWarning
                      className="text-sm text-muted"
                    >
                      {relativeTime(item.createdAt)}
                    </time>
                    {item.lang === "fr" && <Tag>FR</Tag>}
                  </p>
                </div>
                {!item.readAt && (
                  <Button
                    variant="ghost"
                    size="sm"
                    magnetic={false}
                    onClick={() => void markRead({ ids: [item.id] })}
                  >
                    Mark read
                  </Button>
                )}
                <IconButton
                  label={`Delete feedback from ${item.name}`}
                  iconKey="delete"
                  onClick={() => void remove(item)}
                  className="-my-2"
                >
                  <Trash2 className="size-4" />
                </IconButton>
              </header>
              <p className="mt-2 text-body break-words whitespace-pre-wrap text-foreground">
                {pieces(item.body).map((piece, index) =>
                  piece.type === "link" ? (
                    <a
                      key={index}
                      href={piece.href}
                      target="_blank"
                      rel="nofollow noopener noreferrer"
                      className="link-inline"
                    >
                      {piece.text}
                    </a>
                  ) : (
                    piece.text
                  ),
                )}
              </p>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}
