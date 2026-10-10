"use client";

import { useRef, type KeyboardEvent } from "react";
import type { CategoryCount } from "@/lib/creatives/gallery";
import { cn } from "@/lib/cn";
import { useCreativesText } from "@/components/creatives/useCreativesText";
import { format } from "@/lib/i18n/format";

// The Graphic design filter (design.md §13.53): "All" and each category with its
// count, one selected at a time (the orange pill). Arrow keys move between the chips
// (one tab stop), Space or Enter selects. On phones the row scrolls sideways.
export function FilterBar({
  categories,
  selected,
  total,
  onSelect,
}: {
  categories: readonly CategoryCount[];
  selected: string | null;
  total: number;
  onSelect: (slug: string | null) => void;
}) {
  const row = useRef<HTMLDivElement>(null);
  const t = useCreativesText();
  const items: { slug: string | null; label: string }[] = [
    { slug: null, label: format(t.filterAll, { count: total }) },
    ...categories.map((c) => ({
      slug: c.slug,
      label: `${c.name} · ${c.count}`,
    })),
  ];
  const current = items.findIndex((item) => item.slug === selected);

  const move = (event: KeyboardEvent, from: number) => {
    const to =
      event.key === "ArrowRight" || event.key === "ArrowDown"
        ? (from + 1) % items.length
        : event.key === "ArrowLeft" || event.key === "ArrowUp"
          ? (from - 1 + items.length) % items.length
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? items.length - 1
              : -1;
    if (to < 0) return;
    event.preventDefault();
    row.current?.querySelectorAll<HTMLButtonElement>("button")[to]?.focus();
  };

  return (
    <div
      ref={row}
      role="group"
      aria-label={t.filter}
      className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [mask-image:linear-gradient(to_right,black_calc(100%-2rem),transparent)] sm:[mask-image:none]"
    >
      {items.map((item, index) => {
        const active = index === current;
        return (
          <button
            key={item.slug ?? "all"}
            type="button"
            aria-pressed={active}
            tabIndex={index === (current < 0 ? 0 : current) ? 0 : -1}
            onClick={() => onSelect(item.slug)}
            onKeyDown={(event) => move(event, index)}
            className="relative shrink-0 rounded-sm outline-none before:absolute before:-inset-y-2.5 before:inset-x-0 before:content-[''] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <span
              className={cn(
                "type-label inline-flex h-8 items-center rounded-sm px-3.5 whitespace-nowrap transition-colors duration-150",
                active
                  ? "bg-primary text-primary-foreground"
                  : "bg-tile text-muted hover:bg-tile-hover hover:text-foreground",
              )}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
