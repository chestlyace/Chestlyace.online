import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { Token } from "@/lib/blog/tokens";

// The frame the code blocks share (design.md §13.30): a header row with a label
// on the left and controls on the right, then the code, which scrolls sideways
// inside it. Colours come from the `.shiki` rules in globals.css.
export function CodeFrame({
  label,
  controls,
  tabs,
  children,
  className,
}: {
  label?: string;
  controls?: ReactNode;
  /** Replaces the label when the header holds tabs (design.md §13.42). */
  tabs?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "group/code my-8 overflow-hidden rounded-lg border border-border bg-tile",
        className,
      )}
    >
      <div className="flex min-h-10 items-center justify-between gap-3 border-b border-border pr-1.5 pl-4">
        {tabs ?? (
          <span className="type-label min-w-0 truncate text-muted">
            {label}
          </span>
        )}
        <div className="flex shrink-0 items-center gap-0.5">{controls}</div>
      </div>
      {children}
    </div>
  );
}

// One line of highlighted tokens.
export function Tokens({ tokens }: { tokens: Token[] }) {
  return (
    <>
      {tokens.map((token, index) => (
        <span key={index} style={token.style}>
          {token.text}
        </span>
      ))}
    </>
  );
}
