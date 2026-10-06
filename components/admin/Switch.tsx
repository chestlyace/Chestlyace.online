"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/cn";
import { SPRING } from "@/lib/motion";

// A two-state setting (design.md §13.20): 44×26 track, 20px knob, role="switch".
// The knob moves with the default spring; reduced motion makes it jump.
export function Switch({
  checked,
  onChange,
  label,
  disabled = false,
  className,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  /** The accessible name, e.g. "Published: Alexdy". */
  label: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "group/switch relative inline-flex h-[26px] w-11 shrink-0 items-center rounded-full p-[3px] transition-colors duration-150 before:absolute before:-inset-y-2 before:inset-x-0 before:content-[''] disabled:opacity-50",
        checked
          ? "bg-primary"
          : "bg-border [@media(hover:hover)]:not-disabled:hover:bg-muted/50",
        className,
      )}
    >
      <motion.span
        aria-hidden="true"
        initial={false}
        animate={{ x: checked ? 18 : 0 }}
        transition={SPRING}
        className="size-5 rounded-full bg-white shadow-sm transition-[width] duration-100 group-active/switch:w-6"
      />
    </button>
  );
}
