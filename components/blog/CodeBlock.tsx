"use client";

import { Check, Copy } from "lucide-react";
import { useRef, useState, type ComponentProps } from "react";
import { cn } from "@/lib/cn";

// A highlighted code block (design.md §13.30): a header row with the file name
// (or the language) and a copy button, then the code, which scrolls sideways
// inside the frame. The colours were written at render time by Shiki.
export function CodeBlock({
  "data-title": title,
  "data-lang": language,
  "data-line-numbers": lineNumbers,
  className,
  children,
  ...rest
}: ComponentProps<"pre"> & {
  "data-title"?: string;
  "data-lang"?: string;
  "data-line-numbers"?: string;
}) {
  const pre = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);
  const label = title ?? language ?? "code";

  async function copy() {
    const text = pre.current?.textContent ?? "";
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // The browser refused (no permission): nothing to show.
    }
  }

  return (
    <div className="group/code my-8 overflow-hidden rounded-lg border border-border bg-tile">
      <div className="flex h-10 items-center justify-between gap-3 border-b border-border pr-1.5 pl-4">
        <span className="type-label min-w-0 truncate text-muted">{label}</span>
        <button
          type="button"
          onClick={copy}
          aria-label="Copy code"
          className="relative grid size-8 shrink-0 place-items-center rounded-full text-foreground transition-[opacity,background-color] duration-150 ease-out before:absolute before:-inset-1 before:content-[''] hover:bg-tile-hover focus-visible:opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-focus-within/code:opacity-100 [@media(hover:hover)]:group-hover/code:opacity-100"
        >
          {copied ? (
            <Check className="size-4" aria-hidden="true" />
          ) : (
            <Copy className="size-4" aria-hidden="true" />
          )}
        </button>
        <span role="status" className="sr-only">
          {copied ? "Copied" : ""}
        </span>
      </div>
      <div
        role="region"
        aria-label={`${label} code`}
        tabIndex={0}
        className="overflow-x-auto rounded-b-lg outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
      >
        <pre
          ref={pre}
          data-line-numbers={lineNumbers}
          className={cn(
            "shiki px-5 py-4 font-mono text-[0.875rem] leading-[1.65]",
            className,
          )}
          {...rest}
        >
          {children}
        </pre>
      </div>
    </div>
  );
}
