"use client";

import { useRef } from "react";
import type { Token } from "@/lib/blog/tokens";
import { cn } from "@/lib/cn";
import { CodeFrame, Tokens } from "./CodeFrame";
import { CopyButton } from "./CopyButton";
import { useReveal } from "./useReveal";

export type DiffLineView = {
  type: "add" | "remove" | "same";
  tokens: Token[];
  text: string;
};

// `diff` (design.md §13.43): a before-and-after view. Added lines have a tint
// and a `+`, removed lines a tint and a `−`; the signs make the meaning
// independent of colour. On entering, added lines flash in and removed lines
// fade back. Copy copies the new version (added and unchanged lines).
export function Diff({
  title,
  language,
  lines,
}: {
  title: string | null;
  language: string;
  lines: DiffLineView[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  useReveal(ref);
  const after = lines
    .filter((line) => line.type !== "remove")
    .map((line) => line.text);

  return (
    <div ref={ref} className="group/diff">
      <CodeFrame
        label={title ?? language}
        controls={<CopyButton text={after.join("\n")} label="Copy new code" />}
      >
        <div
          role="region"
          aria-label={`${title ?? language} changes`}
          tabIndex={0}
          className="overflow-x-auto outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
        >
          <pre className="shiki py-4 font-mono text-[0.875rem] leading-[1.65]">
            <code className="grid min-w-max">
              {lines.map((line, index) => (
                <span
                  key={index}
                  style={{ transitionDelay: `${Math.min(index, 20) * 60}ms` }}
                  className={cn(
                    "flex min-h-[1lh] transition-[background-color,opacity] duration-[400ms] ease-out",
                    line.type === "add" &&
                      "bg-[color-mix(in_srgb,var(--diff-add)_12%,transparent)] group-data-[phase=armed]/diff:bg-transparent",
                    line.type === "remove" &&
                      "bg-danger/10 opacity-55 group-data-[phase=armed]/diff:opacity-100",
                  )}
                >
                  <span
                    aria-label={
                      line.type === "add"
                        ? "added"
                        : line.type === "remove"
                          ? "removed"
                          : undefined
                    }
                    className={cn(
                      "w-9 shrink-0 text-center select-none",
                      line.type === "add" && "text-[var(--diff-add)]",
                      line.type === "remove" && "text-danger",
                      line.type === "same" && "text-transparent",
                    )}
                  >
                    {line.type === "add"
                      ? "+"
                      : line.type === "remove"
                        ? "−"
                        : " "}
                  </span>
                  <span className="pr-5">
                    <Tokens tokens={line.tokens} />
                  </span>
                </span>
              ))}
            </code>
          </pre>
        </div>
      </CodeFrame>
    </div>
  );
}
