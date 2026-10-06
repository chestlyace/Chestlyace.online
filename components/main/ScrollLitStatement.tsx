"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useEffect, useLayoutEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import { prefersReducedMotionNow, usePrefersReducedMotion } from "@/lib/media";

const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

const DIMMED = 0.18;

// The About statement (design.md §14.2): its words start at 18% and light up one
// after another as the block scrolls through the viewport — the first word as
// the block's top reaches 80% of the screen, the last as its bottom reaches 50%.
// Scrolling back dims them again. The text is in the HTML at full strength; the
// dim state is applied once the words are split, and reduced motion keeps full
// strength throughout.
export function ScrollLitStatement({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLParagraphElement>(null);

  useIsomorphicLayoutEffect(() => {
    const element = ref.current;
    if (reduced || prefersReducedMotionNow() || !element) return;
    gsap.registerPlugin(ScrollTrigger, SplitText);

    let context: gsap.Context | undefined;
    try {
      context = gsap.context(() => {
        SplitText.create(element, {
          type: "words",
          autoSplit: true,
          aria: "auto",
          onSplit(split) {
            return gsap.fromTo(
              split.words,
              { opacity: DIMMED },
              {
                opacity: 1,
                ease: "none",
                duration: 0.1,
                stagger: 0.1,
                scrollTrigger: {
                  trigger: element,
                  start: "top 80%",
                  end: "bottom 50%",
                  scrub: true,
                },
              },
            );
          },
        });
      }, element);
    } catch (error) {
      console.error("Scroll-lit statement failed", error);
      context?.revert();
      return;
    }
    return () => context?.revert();
  }, [reduced]);

  return (
    <p ref={ref} className={cn(className)}>
      {text}
    </p>
  );
}
