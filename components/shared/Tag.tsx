import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export function Tag({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border border-border bg-surface px-2 py-0.5 font-mono text-xs text-muted",
        className,
      )}
      {...props}
    />
  );
}
