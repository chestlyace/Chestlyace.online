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

// Hover effects (magnetic pull, parallax) only run on devices that can hover
// with a precise pointer (design.md §13).
export function useFinePointer(): boolean {
  return useMediaQuery("(hover: hover) and (pointer: fine)", false);
}

// Phone layout: below Tailwind's `md` breakpoint.
export function useIsPhone(): boolean {
  return useMediaQuery("(max-width: 767.98px)", false);
}
