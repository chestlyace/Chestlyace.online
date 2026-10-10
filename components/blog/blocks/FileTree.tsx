"use client";

import {
  ChevronRight,
  File,
  FileCode,
  FileJson,
  Folder,
  FolderOpen,
} from "lucide-react";
import { useMemo, useRef, useState, type KeyboardEvent } from "react";
import type { TreeEntry } from "@/lib/blog/blocks";
import { cn } from "@/lib/cn";
import { useReveal } from "./useReveal";
import { useBlockText } from "./useBlockText";

const CODE =
  /\.(tsx?|jsx?|mjs|cjs|py|sh|zsh|bash|rs|go|rb|php|css|scss|html|vue|svelte|sql|ya?ml|toml)$/i;

function fileIcon(name: string) {
  if (/\.json$/i.test(name)) return FileJson;
  return CODE.test(name) ? FileCode : File;
}

// `filetree` (design.md §13.40): a folder structure with notes. Folders with
// children collapse (click, Enter or Space; arrow keys move and fold) as in the
// ARIA tree pattern; rows reveal top to bottom when the block enters.
export function FileTree({ entries }: { entries: TreeEntry[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useReveal(ref);
  const t = useBlockText();
  const [collapsed, setCollapsed] = useState<ReadonlySet<number>>(new Set());
  const [focused, setFocused] = useState(0);
  const items = useRef<(HTMLDivElement | null)[]>([]);

  const meta = useMemo(
    () =>
      entries.map((entry, index) => ({
        hasChildren:
          entries[index + 1] !== undefined &&
          entries[index + 1].depth > entry.depth,
      })),
    [entries],
  );

  // A row is hidden when any ancestor is collapsed.
  const hidden = useMemo(() => {
    const result: boolean[] = [];
    const stack: { depth: number; collapsed: boolean }[] = [];
    entries.forEach((entry, index) => {
      while (stack.length > 0 && stack[stack.length - 1].depth >= entry.depth)
        stack.pop();
      result[index] = stack.some((item) => item.collapsed);
      stack.push({ depth: entry.depth, collapsed: collapsed.has(index) });
    });
    return result;
  }, [entries, collapsed]);

  const toggle = (index: number) =>
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });

  // Notes line up in a column: each name is as wide as the longest row's end
  // (a mono character is 0.6em; a level of indent is 20px, about 2.4 characters).
  const INDENT_CH = 20 / (0.875 * 16 * 0.6);
  const longest = Math.max(
    ...entries.map((entry) => entry.depth * INDENT_CH + entry.name.length),
  );

  const visible = entries
    .map((_, index) => index)
    .filter((index) => !hidden[index]);

  function onKeyDown(event: KeyboardEvent, index: number) {
    const position = visible.indexOf(index);
    const move = (target: number | undefined) => {
      if (target === undefined) return;
      setFocused(target);
      items.current[target]?.focus();
    };
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        return move(visible[position + 1]);
      case "ArrowUp":
        event.preventDefault();
        return move(visible[position - 1]);
      case "Home":
        event.preventDefault();
        return move(visible[0]);
      case "End":
        event.preventDefault();
        return move(visible[visible.length - 1]);
      case "ArrowRight":
        event.preventDefault();
        if (meta[index].hasChildren && collapsed.has(index)) toggle(index);
        else if (meta[index].hasChildren) move(index + 1);
        return;
      case "ArrowLeft": {
        event.preventDefault();
        if (meta[index].hasChildren && !collapsed.has(index))
          return toggle(index);
        for (let parent = index - 1; parent >= 0; parent--) {
          if (entries[parent].depth < entries[index].depth) return move(parent);
        }
        return;
      }
      case "Enter":
      case " ":
        if (meta[index].hasChildren) {
          event.preventDefault();
          toggle(index);
        }
    }
  }

  return (
    <div
      ref={ref}
      className="group/tree my-10 overflow-x-auto rounded-lg bg-tile px-5 py-4"
    >
      <div role="tree" aria-label={t.fileTree} className="min-w-max">
        {entries.map((entry, index) => {
          const Icon = entry.folder
            ? collapsed.has(index) || !meta[index].hasChildren
              ? Folder
              : FolderOpen
            : fileIcon(entry.name);
          const expandable = meta[index].hasChildren;
          return (
            <div
              key={index}
              role="none"
              className={cn(
                "grid transition-[grid-template-rows] duration-200 ease-out",
                hidden[index] ? "grid-rows-[0fr]" : "grid-rows-[1fr]",
              )}
            >
              <div className="overflow-hidden">
                <div
                  ref={(element) => {
                    items.current[index] = element;
                  }}
                  role="treeitem"
                  aria-selected={false}
                  aria-hidden={hidden[index] || undefined}
                  aria-level={entry.depth + 1}
                  aria-expanded={expandable ? !collapsed.has(index) : undefined}
                  tabIndex={hidden[index] ? -1 : index === focused ? 0 : -1}
                  onClick={() => {
                    setFocused(index);
                    if (expandable) toggle(index);
                  }}
                  onFocus={() => setFocused(index)}
                  onKeyDown={(event) => onKeyDown(event, index)}
                  style={{
                    paddingLeft: `${entry.depth * 20 + 8}px`,
                    transitionDelay: `${Math.min(index, 20) * 30}ms`,
                  }}
                  className={cn(
                    "flex min-h-8 items-center gap-2 rounded-sm pr-2 font-mono text-[0.875rem] transition-[background-color,opacity,transform] duration-[400ms] ease-out outline-none hover:bg-tile-hover/70 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring group-data-[phase=armed]/tree:-translate-x-2 group-data-[phase=armed]/tree:opacity-0",
                    expandable && "cursor-pointer",
                    entry.highlight && "bg-primary/6",
                  )}
                >
                  <span className="grid size-4 shrink-0 place-items-center text-muted">
                    {expandable ? (
                      <ChevronRight
                        className={cn(
                          "size-4 transition-transform duration-200 ease-out",
                          !collapsed.has(index) && "rotate-90",
                        )}
                        aria-hidden="true"
                      />
                    ) : null}
                  </span>
                  <Icon
                    className="size-4 shrink-0 text-muted"
                    aria-hidden="true"
                  />
                  <span
                    style={{
                      minWidth: `${(longest - entry.depth * INDENT_CH + 2).toFixed(2)}ch`,
                    }}
                    className={cn(
                      "whitespace-nowrap text-foreground",
                      entry.highlight && "text-primary-text",
                    )}
                  >
                    {entry.name}
                  </span>
                  {entry.note && (
                    <span className="hidden whitespace-nowrap text-[0.8125rem] text-muted sm:inline">
                      # {entry.note}
                    </span>
                  )}
                  {entry.note && (
                    <span className="sr-only sm:hidden">{entry.note}</span>
                  )}
                </div>
                {entry.note && (
                  <p
                    style={{ paddingLeft: `${entry.depth * 20 + 8 + 48}px` }}
                    className="pb-1 font-mono text-[0.8125rem] text-muted sm:hidden"
                  >
                    # {entry.note}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
