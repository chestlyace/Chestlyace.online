import { cn } from "@/lib/cn";

// Only the "open" state exists for now; limited/closed come with profile data.
export function StatusPill({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 font-eyebrow text-xs font-medium tracking-widest text-foreground uppercase",
        className,
      )}
    >
      <span className="relative flex size-2" aria-hidden="true">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-secondary opacity-75" />
        <span className="relative inline-flex size-2 rounded-full bg-secondary" />
      </span>
      {label}
    </span>
  );
}
