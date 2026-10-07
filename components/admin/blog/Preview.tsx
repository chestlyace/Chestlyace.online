"use client";

import { Moon, Sun } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { Tag } from "@/components/shared/Tag";
import { cn } from "@/lib/cn";
import { renderPreview } from "@/app/sites/admin/(console)/blog/preview";

// Whether the admin itself is in dark mode (the `dark` class on <html>).
function useAdminDark(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const observer = new MutationObserver(onChange);
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
      });
      return () => observer.disconnect();
    },
    () => document.documentElement.classList.contains("dark"),
    () => false,
  );
}

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

// The preview pane (design.md §13.48): the post as readers see it, with its own
// light/dark switch. The body is rendered on the server a moment after you stop
// typing; the header comes from the details.
export function Preview({
  title,
  description,
  tags,
  publishedAt,
  markdown,
  initial,
  initialMarkdown,
  scrollTo,
}: {
  title: string;
  description: string;
  tags: string[];
  /** The published date, `2026-10-07`, or empty for a draft. */
  publishedAt: string;
  markdown: string;
  /** The saved post's body, rendered on the server: shown until the first update. */
  initial: ReactNode;
  /** The markdown `initial` was rendered from. */
  initialMarkdown: string;
  /** 0–1: how far down the post the block being edited is. */
  scrollTo?: number;
}) {
  const [body, setBody] = useState<ReactNode>(initial);
  const rendered = useRef(initialMarkdown);
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);
  const [pane, setPane] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    // What is shown already is this markdown.
    if (markdown === rendered.current) return;
    let current = true;
    const timer = window.setTimeout(() => {
      renderPreview(markdown)
        .then((node) => {
          if (!current) return;
          rendered.current = markdown;
          setBody(node);
        })
        .catch(() => current && setBody(null));
    }, 400);
    return () => {
      current = false;
      window.clearTimeout(timer);
    };
  }, [markdown]);

  useEffect(() => {
    if (!pane || scrollTo === undefined) return;
    pane.scrollTo({
      top: scrollTo * (pane.scrollHeight - pane.clientHeight),
      behavior: "smooth",
    });
  }, [pane, scrollTo]);

  const minutes = Math.max(
    1,
    Math.ceil(markdown.split(/\s+/).filter(Boolean).length / 200),
  );
  const adminDark = useAdminDark();
  const effective = theme ?? (adminDark ? "dark" : "light");
  const flip = () => setTheme(effective === "dark" ? "light" : "dark");

  return (
    <section aria-label="Preview">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="type-label text-muted">Preview</p>
        <button
          type="button"
          onClick={flip}
          aria-pressed={effective === "dark"}
          className="flex h-9 items-center gap-2 rounded-full bg-surface px-3 text-sm font-medium text-foreground"
        >
          {effective === "dark" ? (
            <Moon className="size-4" aria-hidden="true" />
          ) : (
            <Sun className="size-4" aria-hidden="true" />
          )}
          {effective === "dark" ? "Dark" : "Light"}
        </button>
      </div>
      <div
        ref={setPane}
        className={cn(
          "overflow-y-auto rounded-lg border border-border bg-background p-5 text-foreground sm:p-8 xl:max-h-[calc(100dvh-9rem)]",
          theme === "dark" && "dark",
          theme === "light" && "preview-light",
        )}
      >
        <header className="mb-8">
          <SectionHeading
            as="h2"
            size="lg"
            label={`${publishedAt ? formatDate(publishedAt) : "Draft"} · ${minutes} min read`}
            title={title || "Untitled post"}
            intro={description || undefined}
          />
          {tags.length > 0 && (
            <ul aria-label="Tags" className="mt-6 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <li key={tag}>
                  <Tag>{tag}</Tag>
                </li>
              ))}
            </ul>
          )}
        </header>
        {body ?? <p className="text-sm text-muted">Rendering the preview…</p>}
      </div>
    </section>
  );
}
