import { useSyncExternalStore } from "react";

function useMediaQuery(query: string, serverValue: boolean): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia(query);
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => serverValue,
  );
}

export function usePrefersReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)", false);
}

// The opposite of the above, for features that only exist with motion (the
// pinned experience wheel). False on the server and for the first client
// render, so the markup matches before hydration.
export function usePrefersMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: no-preference)", false);
}

// Hover effects (magnetic pull, parallax) only run on devices that can hover
// with a precise pointer (design.md §13).
export function useFinePointer(): boolean {
  return useMediaQuery("(hover: hover) and (pointer: fine)", false);
}

// Phone layout: below Tailwind's `md` breakpoint.
export function useIsPhone(): boolean {
  return useMediaQuery("(max-width: 767.98px)", false);
}

// Read directly, for effects: the hook above reports "not reduced" for the first
// client render (it must match the server's markup), which would make an effect
// apply a start state and then have to undo it. An effect runs on the client, so
// it can ask the browser straight away.
export function prefersReducedMotionNow(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// From the `xl` breakpoint (1280px): where the blog editor shows Write and
// Preview side by side.
export function useIsWide(): boolean {
  return useMediaQuery("(min-width: 80rem)", false);
}
