"use client";

import { ArrowLeft, CircleAlert, Ellipsis } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/shared/Button";
import { Tag } from "@/components/shared/Tag";
import {
  EMPTY_DETAILS,
  bodyOf,
  canAutosave,
  changesOf,
  detailProblems,
  sameSnapshot,
  snapshotOf,
  type PostDetails as Details,
  type PostSnapshot,
  type PostStatus,
} from "@/lib/admin/blogForm";
import { slugify } from "@/lib/admin/order";
import {
  blockProblems,
  blocksToMarkdown,
  emptyBlock,
  markdownToBlocks,
  type EditorBlock,
} from "@/lib/blog/editor";
import { useIsWide } from "@/lib/media";
import { siteUrl } from "@/lib/sites";
import { cn } from "@/lib/cn";
import { useConfirm } from "../ConfirmDialog";
import { useToast } from "../Toast";
import { useUnsavedChanges } from "../UnsavedGuard";
import { BlockList } from "./BlockList";
import { PostDetails } from "./PostDetails";
import { Preview } from "./Preview";

type Tab = "write" | "preview" | "markdown";
type Errors = Record<string, string | undefined>;

const AUTOSAVE_MS = 5000;

// The post editor (design.md §13.48): details, then Write · Preview · Markdown
// (Write and Preview side by side from `xl`), and a save bar with the status,
// Save, Publish and a More menu. Drafts save by themselves 5 seconds after the
// last change.
export function PostEditor({
  id: initialId,
  initial,
  initialPreview,
}: {
  id?: number;
  initial?: PostSnapshot;
  /** The saved post rendered on the server, shown until the preview updates. */
  initialPreview: ReactNode;
}) {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const wide = useIsWide();

  const start = useMemo<PostSnapshot>(
    () =>
      initial ?? {
        details: EMPTY_DETAILS,
        content: "",
        status: "draft",
      },
    [initial],
  );
  const [id, setId] = useState(initialId);
  const [blocks, setBlocks] = useState<EditorBlock[]>(() => {
    const read = markdownToBlocks(start.content);
    return read.length ? read : [emptyBlock("paragraph")];
  });
  // What the editor shows is the blocks written back, so opening a post is not
  // itself a change.
  const [saved, setSaved] = useState<PostSnapshot>(() => ({
    ...start,
    content: blocksToMarkdown(markdownToBlocks(start.content)),
  }));
  const [details, setDetails] = useState<Details>(start.details);
  const [status, setStatus] = useState<PostStatus>(start.status);
  const [mdText, setMdText] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("write");
  const [errors, setErrors] = useState<Errors>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState<"saved" | "autosaved" | null>(null);
  const [slugTouched, setSlugTouched] = useState(Boolean(initialId));
  const [previewAt, setPreviewAt] = useState<number | undefined>(undefined);
  const savingRef = useRef(false);
  const noteTimer = useRef<number | undefined>(undefined);

  const content = mdText ?? blocksToMarkdown(blocks);
  const current: PostSnapshot = { details, content, status };
  const dirty = !sameSnapshot(saved, current);
  useUnsavedChanges(dirty);
  useEffect(() => () => window.clearTimeout(noteTimer.current), []);

  // Problems that stop publishing: the blocks (as they will be read) and details.
  const readBlocks = useMemo(
    () => (mdText !== null ? markdownToBlocks(mdText) : blocks),
    [mdText, blocks],
  );
  const blockIssues = useMemo(() => blockProblems(readBlocks), [readBlocks]);
  const detailIssues = detailProblems(details);
  const problemCount = blockIssues.length + detailIssues.length;

  const change = <K extends keyof Details>(name: K, value: Details[K]) => {
    setDetails((now) => {
      const next = { ...now, [name]: value };
      if (name === "slug") setSlugTouched(true);
      else if (name === "title" && !slugTouched)
        next.slug = slugify(String(value));
      if (name === "tags")
        next.tags = [
          ...new Set(
            (value as string[])
              .map((tag) => slugify(tag).slice(0, 30))
              .filter(Boolean),
          ),
        ];
      return next;
    });
    setErrors((now) => ({ ...now, [name]: undefined }));
  };

  const selectTab = (next: Tab) => {
    // Leaving the Markdown tab re-reads what was typed there.
    if (mdText !== null && next !== "markdown") {
      const read = markdownToBlocks(mdText);
      setBlocks(read.length ? read : [emptyBlock("paragraph")]);
      setMdText(null);
    }
    setTab(next);
  };

  const flash = (kind: "saved" | "autosaved") => {
    setNote(kind);
    window.clearTimeout(noteTimer.current);
    noteTimer.current = window.setTimeout(() => setNote(null), 3000);
  };

  const persist = async (options: { status?: PostStatus; auto?: boolean }) => {
    if (savingRef.current) return false;
    const target: PostSnapshot = {
      ...current,
      status: options.status ?? status,
    };
    const body = id ? changesOf(saved, target) : bodyOf(target);
    if (id && Object.keys(body).length === 0) return true;

    savingRef.current = true;
    setSaving(true);
    setBanner(null);
    let ok = false;
    try {
      const response = await fetch(
        id ? `/api/admin/blog/${id}` : "/api/admin/blog",
        {
          method: id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const result = (await response.json().catch(() => ({}))) as {
        item?: Parameters<typeof snapshotOf>[0] & { id: number };
        fields?: Record<string, string>;
      };
      if (response.ok && result.item) {
        ok = true;
        const stored = snapshotOf(result.item);
        // The server stamps the date when a post first goes live.
        const next: PostSnapshot = {
          ...target,
          details: {
            ...target.details,
            publishedAt:
              target.details.publishedAt || stored.details.publishedAt,
          },
        };
        setSaved(next);
        setDetails((now) => ({
          ...now,
          publishedAt: next.details.publishedAt,
        }));
        setStatus(next.status);
        setErrors({});
        if (!id) {
          setId(result.item.id);
          window.history.replaceState(null, "", `/blog/${result.item.id}`);
        }
        if (options.auto) flash("autosaved");
        else {
          flash("saved");
          toast.success(
            options.status === "published" && status !== "published"
              ? "Published. It's live on the blog."
              : options.status === "draft" && status === "published"
                ? "Unpublished. It's a draft again."
                : "Saved.",
          );
          router.refresh();
        }
      } else if (response.status === 401) {
        toast.error("Your session ended. Sign in again.");
        router.replace(
          `/login?reason=expired&next=${encodeURIComponent(window.location.pathname)}`,
        );
      } else if (response.status === 422 && result.fields) {
        const { content: contentError, _: general, ...rest } = result.fields;
        setErrors(rest);
        setBanner(contentError ?? general ?? null);
        if (Object.keys(rest).length && !contentError)
          document
            .querySelector<HTMLElement>(
              `[name="${Object.keys(rest)[0]}"], #post-${Object.keys(rest)[0]}`,
            )
            ?.focus();
      } else setBanner("Couldn't save. Check your connection and try again.");
    } catch {
      setBanner("Couldn't save. Check your connection and try again.");
    }
    savingRef.current = false;
    setSaving(false);
    return ok;
  };

  // Drafts save by themselves 5 seconds after the last change.
  const persistRef = useRef(persist);
  useEffect(() => {
    persistRef.current = persist;
  });
  useEffect(() => {
    if (!dirty || status !== "draft" || saved.status !== "draft") return;
    if (!canAutosave(details)) return;
    const timer = window.setTimeout(
      () => void persistRef.current({ auto: true }),
      AUTOSAVE_MS,
    );
    return () => window.clearTimeout(timer);
  }, [dirty, details, content, status, saved.status]);

  const fixFirst = () => {
    const first = detailIssues[0];
    if (first) {
      selectTab("write");
      document
        .getElementById(`post-${first.field}`)
        ?.scrollIntoView({ block: "center" });
      document
        .querySelector<HTMLElement>(
          `#post-${first.field} textarea, #post-${first.field}`,
        )
        ?.focus();
      return;
    }
    const block = blockIssues[0];
    if (block) {
      selectTab("write");
      requestAnimationFrame(() => {
        const row = document.getElementById(`block-${block.blockId}`);
        row?.scrollIntoView({ block: "center", behavior: "smooth" });
        row
          ?.querySelector<HTMLElement>("input, textarea, select, button")
          ?.focus({
            preventScroll: true,
          });
      });
    }
  };

  const publishNow = async (next: PostStatus) => {
    if (
      next === "draft" &&
      !(await confirm({
        title: "Unpublish this post?",
        text: "It disappears from the blog until you publish it again.",
        confirmLabel: "Unpublish",
        tone: "primary",
      }))
    )
      return;
    await persist({ status: next });
  };

  const leave = async () => {
    if (
      dirty &&
      !(await confirm({
        title: "Leave without saving?",
        text: "Your changes to this post will be lost.",
        confirmLabel: "Discard changes",
        tone: "primary",
      }))
    )
      return;
    setSaved(current);
    router.push("/blog");
  };

  const split = wide && tab !== "markdown";
  const showWrite = split || tab === "write";
  const showPreview = split || tab === "preview";
  const tabs: [Tab, string][] = wide
    ? [
        ["write", "Write"],
        ["markdown", "Markdown"],
      ]
    : [
        ["write", "Write"],
        ["preview", "Preview"],
        ["markdown", "Markdown"],
      ];

  const word = status === "published" ? "Published" : "Draft";
  const statusText = saving
    ? "Saving…"
    : dirty
      ? status === "draft" && canAutosave(details)
        ? "Unsaved changes · saves in a moment"
        : "Unsaved changes"
      : note === "autosaved"
        ? "Saved"
        : note === "saved"
          ? "All changes saved"
          : null;

  return (
    <div
      onKeyDown={(event) => {
        if (
          (event.metaKey || event.ctrlKey) &&
          event.key.toLowerCase() === "s"
        ) {
          event.preventDefault();
          void persist({});
        }
      }}
      className="pb-28"
    >
      <button
        type="button"
        onClick={leave}
        className="roll-host mb-6 inline-flex items-center gap-2 rounded-sm text-body font-medium text-muted transition-colors duration-150 hover:text-foreground"
      >
        <ArrowLeft className="size-[1em]" aria-hidden="true" />
        Posts
      </button>
      <h1 className="mb-8 text-title text-foreground">
        {id ? "Edit post" : "New post"}
      </h1>

      {banner && (
        <p
          role="alert"
          className="mb-6 flex items-start gap-2 rounded-lg bg-surface-raised p-4 text-sm text-danger"
        >
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {banner}
        </p>
      )}

      <div className="max-w-[45rem]">
        <PostDetails details={details} errors={errors} onChange={change} />
      </div>

      <div
        role="tablist"
        aria-label="Editor view"
        className="mt-10 mb-6 inline-flex rounded-full bg-surface p-1"
      >
        {tabs.map(([value, text]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={(split ? "write" : tab) === value}
            onClick={() => selectTab(value)}
            className={cn(
              "h-9 rounded-full px-4 text-sm font-medium transition-colors duration-150",
              (split ? "write" : tab) === value
                ? "bg-surface-raised text-foreground shadow-sm"
                : "text-muted [@media(hover:hover)]:hover:text-foreground",
            )}
          >
            {text}
          </button>
        ))}
      </div>

      {tab === "markdown" ? (
        <MarkdownTab
          markdown={content}
          editing={mdText !== null}
          onEdit={() => setMdText(content)}
          onChange={setMdText}
        />
      ) : (
        <div className={cn(split && "grid grid-cols-2 items-start gap-8")}>
          {showWrite && (
            <div
              className="min-w-0"
              onFocusCapture={(event) => {
                const row = (event.target as HTMLElement).closest(
                  "li[id^='block-']",
                );
                const index = readBlocks.findIndex(
                  (b) => `block-${b.id}` === row?.id,
                );
                if (index >= 0)
                  setPreviewAt(
                    readBlocks.length > 1 ? index / (readBlocks.length - 1) : 0,
                  );
              }}
            >
              <BlockList
                blocks={blocks}
                onChange={setBlocks}
                problems={blockIssues}
              />
            </div>
          )}
          {showPreview && (
            <div className={cn("min-w-0", split && "sticky top-6")}>
              <Preview
                title={details.title}
                description={details.description}
                tags={details.tags}
                publishedAt={details.publishedAt}
                markdown={content}
                initial={initialPreview}
                initialMarkdown={start.content}
                scrollTo={split ? previewAt : undefined}
              />
            </div>
          )}
        </div>
      )}

      <div className="material fixed inset-x-0 bottom-0 z-40 border-t border-border lg:left-62">
        <div className="mx-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 sm:px-6 lg:mx-0 lg:px-8">
          <p
            aria-live="polite"
            className="flex items-center gap-3 text-sm text-muted"
          >
            {status === "published" ? (
              <Tag>{word}</Tag>
            ) : (
              <Tag className="bg-transparent shadow-[inset_0_0_0_1px_var(--border)]">
                {word}
              </Tag>
            )}
            {dirty && !saving && (
              <span
                aria-hidden="true"
                className="size-2 rounded-full bg-primary"
              />
            )}
            {statusText}
          </p>
          <div className="flex items-center gap-3">
            <MoreMenu
              id={id}
              status={status}
              slug={saved.details.slug}
              dirty={dirty}
              onDuplicate={async () => {
                const response = await fetch(
                  `/api/admin/blog/${id}/duplicate`,
                  { method: "POST" },
                );
                const result = (await response.json().catch(() => ({}))) as {
                  item?: { id: number };
                };
                if (response.ok && result.item)
                  router.push(`/blog/${result.item.id}`);
                else toast.error("Couldn't duplicate that. Try again.");
              }}
              onDelete={async () => {
                if (
                  !(await confirm({
                    title: `Delete “${saved.details.title || "this post"}”?`,
                    text:
                      status === "published"
                        ? "This removes it from the blog. You can't undo this."
                        : "This deletes the draft. You can't undo this.",
                    confirmLabel: "Delete",
                  }))
                )
                  return;
                const response = await fetch(`/api/admin/blog/${id}`, {
                  method: "DELETE",
                });
                if (response.ok) {
                  setSaved(current);
                  toast.success("Post deleted.");
                  router.push("/blog");
                } else toast.error("Couldn't delete that. Try again.");
              }}
            />
            <Button
              variant="ghost"
              magnetic={false}
              loading={saving}
              disabled={!dirty}
              onClick={() => void persist({})}
            >
              Save
            </Button>
            {status === "published" ? (
              <Button
                magnetic={false}
                variant="ghost"
                disabled={saving}
                onClick={() => void publishNow("draft")}
              >
                Unpublish
              </Button>
            ) : problemCount > 0 ? (
              <Button magnetic={false} variant="ghost" onClick={fixFirst}>
                Fix {problemCount} {problemCount === 1 ? "problem" : "problems"}
              </Button>
            ) : (
              <Button
                magnetic={false}
                disabled={saving}
                onClick={() => void publishNow("published")}
              >
                Publish
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MarkdownTab({
  markdown,
  editing,
  onEdit,
  onChange,
}: {
  markdown: string;
  editing: boolean;
  onEdit: () => void;
  onChange: (next: string) => void;
}) {
  return (
    <section aria-label="Markdown">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {editing
            ? "Editing the markdown. Go back to Write to re-read it as blocks."
            : "The markdown the blocks write. It is what is stored."}
        </p>
        {!editing && (
          <Button variant="ghost" size="sm" magnetic={false} onClick={onEdit}>
            Edit markdown
          </Button>
        )}
      </div>
      <label htmlFor="post-markdown" className="sr-only">
        Markdown
      </label>
      <textarea
        id="post-markdown"
        value={markdown}
        readOnly={!editing}
        spellCheck={false}
        onChange={(event) => onChange(event.target.value)}
        rows={24}
        className="block min-h-96 w-full resize-y rounded-md bg-tile px-4 py-3 font-mono text-[0.9375rem] leading-[1.6] whitespace-pre text-foreground shadow-[inset_0_0_0_1px_var(--border)] outline-none focus-visible:outline-2 focus-visible:outline-ring"
      />
    </section>
  );
}

function MoreMenu({
  id,
  status,
  slug,
  dirty,
  onDuplicate,
  onDelete,
}: {
  id?: number;
  status: PostStatus;
  slug: string;
  dirty: boolean;
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
    "flex h-11 w-full items-center gap-2 px-4 text-left text-body text-foreground hover:bg-surface disabled:opacity-40";
  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-label="More"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="grid size-10 place-items-center rounded-full text-foreground transition-colors duration-150 hover:bg-tile"
      >
        <Ellipsis className="size-5" aria-hidden="true" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 bottom-full z-10 mb-2 w-56 overflow-hidden rounded-md border border-border/60 bg-surface-raised py-1 shadow-float-lifted"
        >
          {status === "published" && (
            <a
              role="menuitem"
              href={siteUrl("blog", `/${slug}`)}
              target="_blank"
              rel="noopener"
              className={item}
            >
              View on the blog
            </a>
          )}
          <button
            type="button"
            role="menuitem"
            disabled={!id || dirty}
            title={dirty ? "Save first" : undefined}
            onClick={() => {
              setOpen(false);
              onDuplicate();
            }}
            className={item}
          >
            Duplicate post
          </button>
          <button
            type="button"
            role="menuitem"
            disabled={!id}
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
            className={cn(item, "text-danger")}
          >
            Delete post
          </button>
        </div>
      )}
    </div>
  );
}
