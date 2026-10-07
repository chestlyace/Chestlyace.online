import { Info, Lightbulb, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { CalloutType } from "@/lib/blog/markdown";

const TYPES = {
  note: { icon: Info, label: "Note", tone: "text-primary-text" },
  tip: { icon: Lightbulb, label: "Tip", tone: "text-primary-text" },
  warning: { icon: TriangleAlert, label: "Warning", tone: "text-danger" },
} as const;

// A short aside in a post (design.md §13.31): `note`, `tip` or `warning`. The
// label is text as well as an icon, so the type never rests on colour alone.
export function Callout({
  type,
  title,
  children,
}: {
  type: CalloutType;
  title?: string;
  children: ReactNode;
}) {
  const { icon: Icon, label, tone } = TYPES[type] ?? TYPES.note;
  return (
    <aside
      role="note"
      className="my-8 rounded-lg bg-tile p-5 sm:p-6 [&>:first-child]:mt-0"
    >
      <p className={cn("type-label flex items-center gap-2", tone)}>
        <Icon className="size-5" aria-hidden="true" />
        {label}
      </p>
      {title && (
        <p className="mt-3 text-body font-semibold text-foreground">{title}</p>
      )}
      <div className="mt-3 text-body leading-[1.7] text-foreground [&>:last-child]:mb-0 [&>p+p]:mt-4">
        {children}
      </div>
    </aside>
  );
}
