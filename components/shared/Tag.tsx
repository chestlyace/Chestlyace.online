import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

// Mono label chip for tech stacks and blog tags (design.md §13.4). Linked tags
// get hover and a 44px hit area; plain tags have no motion of their own.
const base =
  "type-label inline-flex h-6 items-center rounded-sm bg-tile px-2.5 whitespace-nowrap text-muted";

export function Tag({ className, ...props }: ComponentProps<"span">) {
  return <span className={cn(base, className)} {...props} />;
}

export function TagLink({ className, ...props }: ComponentProps<"a">) {
  return (
    <a
      className={cn(
        base,
        "relative transition-colors duration-150 before:absolute before:-inset-y-2.5 before:inset-x-0 before:content-[''] hover:bg-tile-hover hover:text-foreground",
        className,
      )}
      {...props}
    />
  );
}
