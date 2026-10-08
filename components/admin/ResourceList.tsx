"use client";

import { Ellipsis, GripVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { AnimatePresence, Reorder, useDragControls } from "motion/react";
import Link from "next/link";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Button } from "@/components/shared/Button";
import { IconButton } from "@/components/shared/IconButton";
import { Tag } from "@/components/shared/Tag";
import {
  adminConfig,
  type AdminConfig,
  type AdminRow,
} from "@/lib/admin/config";
import { findEditable } from "@/lib/admin/resources";
import { mergeSubset } from "@/lib/admin/order";
import { cn } from "@/lib/cn";
import { useConfirm } from "./ConfirmDialog";
import { Switch } from "./Switch";
import { useToast } from "./Toast";

async function send(
  url: string,
  method: "PATCH" | "POST" | "DELETE",
  body?: unknown,
): Promise<boolean> {
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

// A resource's list screen (design.md §13.19): the entries in the order the site
// shows them, with a publish switch, edit and delete, and drag-to-reorder by
// pointer or keyboard. Changes show at once and are undone if the save fails.
export function ResourceList({
  resourceId,
  initial,
}: {
  resourceId: string;
  initial: AdminRow[];
}) {
  const config = adminConfig(resourceId) as AdminConfig;
  const resource = findEditable(resourceId)!;
  const toast = useToast();
  const confirm = useConfirm();

  const [items, setItems] = useState<AdminRow[]>(initial);
  const [announcement, setAnnouncement] = useState("");
  const latest = useRef(items);
  useEffect(() => {
    latest.current = items;
  }, [items]);
  const dragStart = useRef<number[]>([]);

  // Experience has tabs (All / Work / Education): the list shows one of them and
  // reorders within it.
  const [tab, setTab] = useState("all");
  const inTab = (item: AdminRow) =>
    tab === "all" || !config.tabs || item[config.tabs.field] === tab;
  const visible = items.filter(inTab);

  // New data from the server (after a refresh) replaces the local copy.
  const [seen, setSeen] = useState(initial);
  if (seen !== initial) {
    setSeen(initial);
    setItems(initial);
  }

  const ids = (list: AdminRow[]) => list.filter(inTab).map((item) => item.id);

  const persistOrder = async (before: number[]) => {
    const after = ids(latest.current);
    if (JSON.stringify(before) === JSON.stringify(after)) return;
    const ok = await send(`/api/admin/${resource.api}/reorder`, "POST", {
      ids: after,
    });
    if (!ok) {
      setItems((current) =>
        mergeSubset(
          current,
          before.flatMap((id) => current.filter((row) => row.id === id)),
        ),
      );
      toast.error("Couldn't reorder. The list is back as it was.");
    }
  };

  const togglePublished = async (item: AdminRow, next: boolean) => {
    setItems((current) =>
      current.map((row) =>
        row.id === item.id ? { ...row, isPublished: next } : row,
      ),
    );
    const ok = await send(`/api/admin/${resource.api}/${item.id}`, "PATCH", {
      isPublished: next,
    });
    if (!ok) {
      setItems((current) =>
        current.map((row) =>
          row.id === item.id ? { ...row, isPublished: !next } : row,
        ),
      );
      toast.error("Couldn't change that. Try again.");
    }
  };

  const remove = async (item: AdminRow) => {
    const title = config.row(item).title;
    if (
      !(await confirm({
        title: `Delete “${title}”?`,
        text: "This removes it from the site. You can't undo this.",
        confirmLabel: "Delete",
      }))
    ) {
      return;
    }
    const ok = await send(`/api/admin/${resource.api}/${item.id}`, "DELETE");
    if (ok) {
      setItems((current) => current.filter((row) => row.id !== item.id));
      toast.success(`Deleted “${title}”.`);
    } else {
      toast.error("Couldn't delete that. Try again.");
    }
  };

  const noun = resource.noun;

  return (
    <>
      {config.tabs && (
        <div
          role="tablist"
          aria-label={`${resource.label} filter`}
          className="mb-6 inline-flex rounded-full bg-surface p-1"
        >
          {config.tabs.options.map(([value, text]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={tab === value}
              onClick={() => setTab(value)}
              className={cn(
                "h-9 rounded-full px-4 text-sm font-medium transition-colors duration-150",
                tab === value
                  ? "bg-surface-raised text-foreground shadow-sm"
                  : "text-muted [@media(hover:hover)]:hover:text-foreground",
              )}
            >
              {text}
            </button>
          ))}
        </div>
      )}
      <div className="mb-6 flex items-center justify-between gap-4">
        <p className="text-sm text-muted">
          {visible.length} {visible.length === 1 ? "entry" : "entries"}
        </p>
        <Button
          href={`${resource.href}/new`}
          magnetic={false}
          trailingIcon={<Plus />}
          iconNudge="none"
        >
          New {noun}
        </Button>
      </div>

      {visible.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg bg-surface px-6 py-16 text-center">
          <p className="text-h3">Nothing here yet</p>
          <p className="max-w-[36ch] text-sm text-muted">
            Add the first {noun} and it will appear here.
          </p>
          <Button
            href={`${resource.href}/new`}
            magnetic={false}
            className="mt-2"
          >
            New {noun}
          </Button>
        </div>
      ) : (
        <Reorder.Group
          as="ul"
          axis="y"
          values={visible}
          onReorder={(next) =>
            setItems((current) => mergeSubset(current, next))
          }
          className="overflow-hidden rounded-lg bg-surface"
        >
          <AnimatePresence initial={false}>
            {visible.map((item, index) => (
              <Row
                key={item.id}
                item={item}
                index={index}
                total={visible.length}
                config={config}
                href={`${resource.href}/${item.id}`}
                onDragStart={() => (dragStart.current = ids(latest.current))}
                onDragEnd={() => persistOrder(dragStart.current)}
                onToggle={(next) => togglePublished(item, next)}
                onDelete={() => remove(item)}
                onMove={(to, commit) => {
                  const before = ids(latest.current);
                  setItems((current) => {
                    const shown = current.filter(inTab);
                    const [moved] = shown.splice(index, 1);
                    shown.splice(to, 0, moved);
                    return mergeSubset(current, shown);
                  });
                  if (commit)
                    setAnnouncement(
                      `Moved to position ${to + 1} of ${visible.length}`,
                    );
                  return before;
                }}
                onCommit={persistOrder}
                announce={setAnnouncement}
              />
            ))}
          </AnimatePresence>
        </Reorder.Group>
      )}
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </>
  );
}

function Row({
  item,
  index,
  total,
  config,
  href,
  onDragStart,
  onDragEnd,
  onToggle,
  onDelete,
  onMove,
  onCommit,
  announce,
}: {
  item: AdminRow;
  index: number;
  total: number;
  config: AdminConfig;
  href: string;
  onDragStart: () => void;
  onDragEnd: () => void;
  onToggle: (next: boolean) => void;
  onDelete: () => void;
  onMove: (to: number, commit?: boolean) => number[];
  onCommit: (before: number[]) => void;
  announce: (message: string) => void;
}) {
  const controls = useDragControls();
  const { title, subtitle } = config.row(item);
  const thumb = config.thumb?.(item) ?? null;
  const featured = config.featured?.(item) ?? false;
  const published = config.hasPublished ? Boolean(item.isPublished) : true;

  // Keyboard reordering: Space picks the row up, arrows move it, Space drops it
  // (which saves), Escape puts it back.
  const [picked, setPicked] = useState(false);
  const origin = useRef<{ position: number; ids: number[] } | null>(null);

  const onHandleKey = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      if (!picked) {
        setPicked(true);
        origin.current = { position: index, ids: [] };
        announce(`Picked up ${title}, position ${index + 1} of ${total}`);
      } else {
        setPicked(false);
        announce(`Dropped at position ${index + 1}`);
        // The drop saves: the list is already in its new order.
        if (origin.current) {
          const before = origin.current;
          origin.current = null;
          onCommit(before.ids);
        }
      }
    } else if (
      picked &&
      (event.key === "ArrowUp" || event.key === "ArrowDown")
    ) {
      event.preventDefault();
      const to = event.key === "ArrowUp" ? index - 1 : index + 1;
      if (to < 0 || to >= total) return;
      const before = onMove(to, true);
      if (origin.current && origin.current.ids.length === 0)
        origin.current.ids = before;
      requestAnimationFrame(() =>
        document.getElementById(`handle-${item.id}`)?.focus(),
      );
    } else if (picked && event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      const start = origin.current;
      setPicked(false);
      origin.current = null;
      if (start && start.ids.length > 0) {
        announce("Reorder cancelled");
        onMove(start.position);
      }
    }
  };

  return (
    <Reorder.Item
      as="li"
      value={item}
      dragListener={false}
      dragControls={controls}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      exit={{ opacity: 0, height: 0, transition: { duration: 0.2 } }}
      whileDrag={{
        scale: 1.01,
        boxShadow: "var(--shadow-float-lifted)",
        zIndex: 2,
      }}
      className={cn(
        "relative flex min-h-16 items-center gap-3 border-b border-border bg-surface px-4 py-3 last:border-b-0 [@media(hover:hover)]:hover:bg-surface-raised",
        picked && "bg-surface-raised ring-2 ring-ring ring-inset",
      )}
    >
      <button
        type="button"
        id={`handle-${item.id}`}
        aria-label={`Reorder ${title}`}
        aria-pressed={picked}
        onPointerDown={(event) => controls.start(event)}
        onKeyDown={onHandleKey}
        onBlur={() => {
          if (picked) {
            setPicked(false);
            origin.current = null;
          }
        }}
        className="relative -ml-2 grid size-11 shrink-0 cursor-grab touch-none place-items-center rounded-md text-muted active:cursor-grabbing"
      >
        <GripVertical className="size-5" aria-hidden="true" />
      </button>

      {thumb && (
        // eslint-disable-next-line @next/next/no-img-element -- Cloudinary thumbnail
        <img
          src={thumb}
          alt=""
          className="size-12 shrink-0 rounded-sm bg-surface object-cover"
        />
      )}
      <Link href={href} className="min-w-0 flex-1 rounded-sm">
        <span className="block truncate text-body font-medium text-foreground">
          {title}
        </span>
        <span className="block truncate text-sm text-muted">{subtitle}</span>
      </Link>

      {featured && <Tag className="hidden md:inline-flex">Featured</Tag>}

      {config.hasPublished && (
        <>
          <span className="hidden md:block">
            {published ? (
              <Tag>Published</Tag>
            ) : (
              <Tag className="bg-transparent shadow-[inset_0_0_0_1px_var(--border)]">
                Draft
              </Tag>
            )}
          </span>
          <Switch
            checked={published}
            onChange={onToggle}
            label={`Published: ${title}`}
          />
        </>
      )}

      <div className="hidden items-center md:flex">
        <IconButton
          label={`Edit ${title}`}
          iconKey="edit"
          onClick={() => (window.location.href = href)}
        >
          <Pencil className="size-[1.125rem]" />
        </IconButton>
        <IconButton
          label={`Delete ${title}`}
          iconKey="delete"
          onClick={onDelete}
          className="hover:text-danger focus-visible:text-danger"
        >
          <Trash2 className="size-[1.125rem]" />
        </IconButton>
      </div>
      <RowMenu title={title} href={href} onDelete={onDelete} />
    </Reorder.Item>
  );
}

// Below `md` the edit and delete buttons collapse into one "More" menu.
function RowMenu({
  title,
  href,
  onDelete,
}: {
  title: string;
  href: string;
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
        <div className="absolute top-full right-0 z-10 mt-1 w-40 overflow-hidden rounded-md border border-border/60 bg-surface-raised py-1 shadow-float-lifted">
          <Link
            href={href}
            className="flex h-11 items-center gap-2 px-4 text-body text-foreground hover:bg-surface"
          >
            <Pencil className="size-4" aria-hidden="true" />
            Edit
          </Link>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
            className="flex h-11 w-full items-center gap-2 px-4 text-left text-body text-danger hover:bg-surface"
          >
            <Trash2 className="size-4" aria-hidden="true" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
