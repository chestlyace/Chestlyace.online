"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";

// The small copy control in a block's header (design.md §13.30): a Lucide
// `copy` that becomes `check` for 2 seconds, with a polite "Copied" for screen
// readers. `text` is exactly what goes on the clipboard.
export function CopyButton({
  text,
  label = "Copy code",
  className,
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // The browser refused: nothing to show.
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={copy}
        aria-label={label}
        className={cn(
          "relative grid size-8 shrink-0 place-items-center rounded-full transition-colors duration-150 before:absolute before:-inset-1 before:content-[''] hover:bg-tile-hover",
          className,
        )}
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
    </>
  );
}
