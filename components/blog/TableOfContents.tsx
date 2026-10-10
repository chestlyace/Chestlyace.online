"use client";

import { ChevronDown } from "lucide-react";
import { LayoutGroup, motion } from "motion/react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import type { TocItem } from "@/lib/blog/markdown";
import { SPRING } from "@/lib/motion";

// "On this page" (design.md §13.32): a sticky rail from `lg`, a native
// disclosure below it. The caller leaves it out for a post with fewer than 3
// headings. The active heading is the last one above 40% of the viewport; its
// rule moves between items with a shared-layout spring.
function useActiveHeading(ids: string[]): string | null {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null);
    if (elements.length === 0) return;

    const update = () => {
      const line = window.innerHeight * 0.4;
      let current: string | null = null;
      for (const element of elements) {
        if (element.getBoundingClientRect().top <= line) current = element.id;
      }
      setActive(current);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [ids]);

  return active;
}

function List({
  items,
  active,
  rule,
}: {
  items: TocItem[];
  active: string | null;
  rule: boolean;
}) {
  return (
    <ul className="flex flex-col gap-2 text-sm leading-[1.45]">
      {items.map((item) => {
        const current = item.id === active;
        return (
          <li
            key={item.id}
            className={cn("relative", item.depth === 3 && "pl-4")}
          >
            {rule && current && (
              <motion.span
                layoutId="toc-rule"
                transition={SPRING}
                aria-hidden="true"
                className="absolute inset-y-0 -left-3 w-0.5 rounded-full bg-primary"
              />
            )}
            <a
              href={`#${item.id}`}
              aria-current={current ? "location" : undefined}
              className={cn(
                "block rounded-sm py-0.5 transition-colors duration-150",
                current
                  ? "text-foreground"
                  : "text-muted hover:text-foreground",
              )}
            >
              {item.text}
            </a>
          </li>
        );
      })}
    </ul>
  );
}

export function TableOfContents({
  items,
  label,
}: {
  items: TocItem[];
  /** "On this page" in the page's language. */
  label: string;
}) {
  const ids = items.map((item) => item.id);
  const active = useActiveHeading(ids);

  return (
    <>
      <nav
        aria-label={label}
        className="sticky top-28 hidden max-h-[calc(100dvh-9rem)] overflow-y-auto pl-3 lg:block"
      >
        <p className="type-label mb-4 text-muted">{label}</p>
        <LayoutGroup id="toc">
          <List items={items} active={active} rule />
        </LayoutGroup>
      </nav>

      <details className="group/toc rounded-md bg-tile lg:hidden">
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 rounded-md px-4 text-sm font-medium text-foreground [&::-webkit-details-marker]:hidden">
          {label}
          <ChevronDown
            className="size-4 transition-transform duration-200 ease-out group-open/toc:rotate-180"
            aria-hidden="true"
          />
        </summary>
        <nav aria-label={label} className="px-4 pb-4">
          <List items={items} active={active} rule={false} />
        </nav>
      </details>
    </>
  );
}
