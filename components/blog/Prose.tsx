import type { ReactNode } from "react";

// The wrapper of a post's rendered markdown (design.md §13.29): the reading
// column and the one thing the element components can't style, inline code.
export function Prose({ children }: { children: ReactNode }) {
  return (
    <div className="max-w-[68ch] [&_:not(pre)>code]:rounded-sm [&_:not(pre)>code]:bg-tile [&_:not(pre)>code]:px-1.5 [&_:not(pre)>code]:py-0.5 [&_:not(pre)>code]:font-mono [&_:not(pre)>code]:text-[0.9em]">
      {children}
    </div>
  );
}
