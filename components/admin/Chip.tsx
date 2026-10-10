import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

// A small status pill for the admin's lists (design.md §13.25): filled when "on", an outline
// when "off", red when "danger". Its own element rather than a `Tag` with overrides:
// the class helper only joins names, so two background classes would fight.
export function Chip({
  tone,
  title,
  className,
  children,
}: {
  tone: "on" | "off" | "danger";
  title?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      title={title}
      className={cn(
        "type-label inline-flex h-6 items-center rounded-sm px-2.5 whitespace-nowrap",
        tone === "on" && "bg-primary text-primary-foreground",
        tone === "off" && "text-muted shadow-[inset_0_0_0_1px_var(--border)]",
        tone === "danger" &&
          "text-danger shadow-[inset_0_0_0_1px_var(--danger)]",
        className,
      )}
    >
      {children}
    </span>
  );
}
