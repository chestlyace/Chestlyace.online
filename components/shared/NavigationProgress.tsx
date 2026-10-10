"use client";

import { useSyncExternalStore } from "react";
import { getLoadingPhase, subscribeLoading } from "@/lib/loadingStore";
import { BrandLoader } from "./BrandLoader";

// Feedback for a page change (design.md §13.64): a slim bar from the click, and, only if
// the page takes longer than 400ms, the brand loader over a veil. The 400ms is a CSS
// delay on the veil's fade-in (`.nav-veil`), so a quick navigation never flashes it:
// the veil is gone before it became visible. Rendered once per site, in the document.
export function NavigationProgress() {
  const phase = useSyncExternalStore(
    subscribeLoading,
    getLoadingPhase,
    () => "idle" as const,
  );
  if (phase === "idle") return null;
  return (
    <>
      <div
        aria-hidden="true"
        data-phase={phase}
        className="nav-bar pointer-events-none fixed inset-x-0 top-0 z-[200] h-0.5 origin-left bg-primary"
      />
      {phase === "loading" && (
        <div className="nav-veil pointer-events-none fixed inset-0 z-[190] grid place-items-center bg-background/92">
          <BrandLoader size="lg" />
        </div>
      )}
    </>
  );
}
