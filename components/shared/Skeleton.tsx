"use client";

import type { CSSProperties, ReactNode } from "react";
import { LOADING } from "@/lib/i18n/ui";
import { cn } from "@/lib/cn";
import { useLang } from "./LangProvider";

// The placeholder of content that is loading (design.md §13.65, D91): blocks of `tile`
// colour with the content's own radius and a shimmer (a diagonal band sweeping across
// them all together). `.skeleton` is in globals.css; reduced motion leaves it static.

/** A block. Size it with classes (`h-6 w-2/3`, `aspect-video`) or `style`. */
export function SkeletonBlock({
  className,
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      aria-hidden="true"
      style={style}
      className={cn("skeleton rounded-md", className)}
    />
  );
}

const LINE_WIDTHS = ["100%", "94%", "98%", "72%", "100%", "88%", "96%", "60%"];

/** `count` lines of text, with the ragged widths of a paragraph. */
export function SkeletonText({
  count = 3,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div aria-hidden="true" className={cn("grid gap-3", className)}>
      {Array.from({ length: count }, (_, index) => (
        <SkeletonBlock
          key={index}
          className="h-4"
          style={{ width: LINE_WIDTHS[index % LINE_WIDTHS.length] }}
        />
      ))}
    </div>
  );
}

/** The wrapper of a page's skeleton: busy, with one status for screen readers. */
export function SkeletonShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const lang = useLang();
  return (
    <div aria-busy="true" className={cn("flex-1", className)}>
      <span role="status" className="sr-only">
        {LOADING[lang]}
      </span>
      {children}
    </div>
  );
}
