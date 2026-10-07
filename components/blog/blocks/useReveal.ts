"use client";

import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";
import { prefersReducedMotionNow } from "@/lib/media";

const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

// The entrance of a rich block (design.md §13.38 and the shared rules above
// it): the content is in the HTML at full strength; once JavaScript runs the
// block is *armed* (`data-phase="armed"`, which the block's styles use to hide
// its parts) and *plays* (`data-phase="played"`) the first time it is 70% into
// the viewport, then stays. Reduced motion never arms it. The phase is a DOM
// attribute, not React state, so a replay or re-render never undoes it.
export function useReveal(
  ref: RefObject<HTMLElement | null>,
  onPlay?: () => void,
) {
  const callback = useRef(onPlay);
  useEffect(() => {
    callback.current = onPlay;
  });

  useIsomorphicLayoutEffect(() => {
    const element = ref.current;
    if (!element || prefersReducedMotionNow()) return;
    element.dataset.phase = "armed";
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        element.dataset.phase = "played";
        callback.current?.();
        observer.disconnect();
      },
      { rootMargin: "0px 0px -30% 0px" },
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
      delete element.dataset.phase;
    };
  }, [ref]);
}
