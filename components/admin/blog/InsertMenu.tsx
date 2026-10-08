"use client";

import { Plus } from "lucide-react";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import type { BlockType } from "@/lib/blog/editor";
import { cn } from "@/lib/cn";
import { fieldControl } from "@/components/shared/FormField";

// What can be inserted (design.md §13.48), in the spec's groups. The flow canvas
// and the agent session arrive with later steps.
export const INSERTABLE: { group: string; items: [BlockType, string][] }[] = [
  {
    group: "Text",
    items: [
      ["paragraph", "Paragraph"],
      ["heading", "Heading"],
      ["quote", "Quote"],
      ["list", "List"],
      ["callout", "Callout"],
      ["divider", "Divider"],
    ],
  },
  {
    group: "Media",
    items: [
      ["image", "Image"],
      ["code", "Code"],
      ["codegroup", "Code group"],
      ["diff", "Diff"],
    ],
  },
  {
    group: "Interactive",
    items: [
      ["steps", "Steps"],
      ["compare", "Compare"],
      ["filetree", "File tree"],
      ["terminal", "Terminal"],
      ["typewriter", "Typewriter code"],
      ["quiz", "Quiz"],
    ],
  },
  { group: "Advanced", items: [["raw", "Raw markdown"]] },
];

// A popover menu with a search field (design.md §13.48): arrow keys move,
// Enter inserts, Escape closes.
export function InsertMenu({
  onPick,
  onClose,
  label,
}: {
  onPick: (type: BlockType) => void;
  onClose: () => void;
  label: string;
}) {
  const [query, setQuery] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    root.current?.querySelector<HTMLInputElement>("input")?.focus();
    const away = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) onClose();
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [onClose]);

  const needle = query.trim().toLowerCase();
  const groups = INSERTABLE.map((group) => ({
    ...group,
    items: group.items.filter(([, text]) =>
      text.toLowerCase().includes(needle),
    ),
  })).filter((group) => group.items.length > 0);

  const move = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const controls = [
      ...(root.current?.querySelectorAll<HTMLElement>(
        "input, [role=menuitem]",
      ) ?? []),
    ];
    const at = controls.indexOf(document.activeElement as HTMLElement);
    const next = event.key === "ArrowDown" ? at + 1 : at - 1;
    controls[(next + controls.length) % controls.length]?.focus();
  };

  return (
    <div
      ref={root}
      onKeyDown={move}
      className="absolute left-0 z-20 mt-2 w-64 rounded-md border border-border/60 bg-surface-raised p-2 shadow-float-lifted"
    >
      <label htmlFor={`${id}-q`} className="sr-only">
        Search blocks
      </label>
      <input
        id={`${id}-q`}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            const first = groups[0]?.items[0];
            if (first) {
              event.preventDefault();
              onPick(first[0]);
            }
          }
        }}
        placeholder="Search blocks"
        className={cn(fieldControl, "mb-2 h-10 px-3 text-[0.9375rem]")}
      />
      <div role="menu" aria-label={label} className="max-h-72 overflow-y-auto">
        {groups.length === 0 && (
          <p className="px-3 py-2 text-sm text-muted">No block matches.</p>
        )}
        {groups.map((group) => (
          <div key={group.group} role="group" aria-label={group.group}>
            <p className="type-label px-3 pt-2 pb-1 text-muted">
              {group.group}
            </p>
            {group.items.map(([type, text]) => (
              <button
                key={type}
                type="button"
                role="menuitem"
                onClick={() => onPick(type)}
                className="flex h-10 w-full items-center rounded-sm px-3 text-left text-body text-foreground outline-none hover:bg-tile focus-visible:bg-tile focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
              >
                {text}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// The "+" between blocks: it shows on hover or focus, and always at the end.
export function InsertButton({
  onPick,
  always = false,
  label,
}: {
  onPick: (type: BlockType) => void;
  always?: boolean;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const close = () => {
    setOpen(false);
    button.current?.focus();
  };
  return (
    <div className="group/insert relative flex h-8 items-center">
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-1/2 h-px bg-border opacity-0 transition-opacity duration-150 group-hover/insert:opacity-100 group-focus-within/insert:opacity-100"
      />
      <button
        ref={button}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "relative flex h-8 items-center gap-1.5 rounded-full bg-surface-raised px-2.5 text-sm font-medium text-muted shadow-[inset_0_0_0_1px_var(--border)] transition-[opacity,color] duration-150 hover:text-foreground focus-visible:opacity-100",
          always
            ? "opacity-100"
            : "opacity-0 group-hover/insert:opacity-100 group-focus-within/insert:opacity-100",
          open && "opacity-100",
        )}
      >
        <Plus className="size-4" aria-hidden="true" />
        {always && "Add a block"}
      </button>
      {open && (
        <div className="absolute top-full left-0">
          <InsertMenu
            label={label}
            onClose={close}
            onPick={(type) => {
              setOpen(false);
              onPick(type);
            }}
          />
        </div>
      )}
    </div>
  );
}
