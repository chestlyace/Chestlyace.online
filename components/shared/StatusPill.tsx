"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

// "Open to Remote Roles" with a pulsing green dot (design.md §13.5). Only the
// "open" state exists for now (D29). The pulse pauses while off-screen.
export function StatusPill({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) =>
      setVisible(entry.isIntersecting),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <span
      ref={ref}
      className={cn(
        "inline-flex h-8 items-center gap-2 rounded-full border border-border bg-tile py-1.5 pr-3.5 pl-3 text-sm font-medium text-foreground",
        className,
      )}
    >
      <span className="relative flex size-2" aria-hidden="true">
        <span
          className="absolute inline-flex size-full animate-pulse-ring rounded-full bg-secondary"
          style={{ animationPlayState: visible ? "running" : "paused" }}
        />
        <span className="relative inline-flex size-2 rounded-full bg-secondary" />
      </span>
      {label}
    </span>
  );
}
