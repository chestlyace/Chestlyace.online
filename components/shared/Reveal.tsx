"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { prefersReducedMotionNow, usePrefersReducedMotion } from "@/lib/media";

const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

// Default section entrance (design.md §14.0): children rise and fade in once
// their container is 85% down the viewport. Items are the elements marked
// `data-reveal`, or the direct children. The content is in the HTML at full
// strength; the hidden start state is only applied once JavaScript is running,
// and reduced motion leaves everything alone.
export function Reveal({
  children,
  className,
  y = 24,
  duration = 0.65,
  stagger = 0.08,
  ease = "power3.out",
}: {
  children: ReactNode;
  className?: string;
  y?: number;
  duration?: number;
  stagger?: number;
  ease?: string;
}) {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  useIsomorphicLayoutEffect(() => {
    const root = ref.current;
    if (reduced || prefersReducedMotionNow() || !root) return;
    gsap.registerPlugin(ScrollTrigger);

    const marked = root.querySelectorAll<HTMLElement>("[data-reveal]");
    const items =
      marked.length > 0 ? Array.from(marked) : Array.from(root.children);

    let context: gsap.Context | undefined;
    try {
      context = gsap.context(() => {
        // Explicit start values: never "where it is now".
        gsap.fromTo(
          items,
          { opacity: 0, y },
          {
            opacity: 1,
            y: 0,
            duration,
            ease,
            stagger,
            scrollTrigger: {
              trigger: root,
              start: "top 85%",
              toggleActions: "play none none none",
            },
          },
        );
      }, root);
    } catch (error) {
      console.error("Reveal failed", error);
      context?.revert();
      gsap.set(items, { clearProps: "all" });
      return;
    }
    return () => context?.revert();
  }, [reduced, y, duration, stagger, ease]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
