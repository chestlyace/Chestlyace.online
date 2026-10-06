import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

// Wide (1280px) for grids and media; narrow (980px) for text-led sections.
// Gutters 16 / 24 / 32px (design.md §5).
export function Container({
  narrow = false,
  className,
  ...props
}: ComponentProps<"div"> & { narrow?: boolean }) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 sm:px-6 lg:px-8",
        narrow ? "max-w-[calc(980px+4rem)]" : "max-w-[calc(1280px+4rem)]",
        className,
      )}
      {...props}
    />
  );
}
