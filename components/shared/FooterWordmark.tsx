"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useEffect, useLayoutEffect, useRef } from "react";
import { prefersReducedMotionNow, usePrefersReducedMotion } from "@/lib/media";

const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

// The giant "CHESTLY ACE" (design.md §13.8). It is sized to the container's
// width with container-query units (no JavaScript), and its letters rise from
// a clip box, scrubbed to scroll, as the wordmark travels from entering the
// viewport to the page bottom. Decorative: the brand block already names the
// site.
export function FooterWordmark() {
  const reduced = usePrefersReducedMotion();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  useIsomorphicLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    const text = textRef.current;
    if (reduced || prefersReducedMotionNow() || !wrapper || !text) return;
    gsap.registerPlugin(ScrollTrigger, SplitText);

    let context: gsap.Context | undefined;
    // Decorative: if the animation fails the wordmark just stays visible.
    try {
      context = gsap.context(() => {
        SplitText.create(text, {
          type: "lines,chars",
          mask: "lines",
          autoSplit: true,
          aria: "none",
          onSplit(split) {
            return gsap.from(split.chars, {
              yPercent: 110,
              ease: "none",
              stagger: 0.04,
              scrollTrigger: {
                trigger: wrapper,
                start: "top bottom",
                end: "bottom bottom",
                scrub: true,
              },
            });
          },
        });
      }, wrapper);
    } catch (error) {
      console.error("Footer wordmark animation failed", error);
      context?.revert();
      return;
    }

    return () => context?.revert();
  }, [reduced]);

  return (
    <div
      ref={wrapperRef}
      aria-hidden="true"
      className="mt-16 [container-type:inline-size] md:mt-24"
    >
      <span
        ref={textRef}
        className="block font-display leading-[0.8] whitespace-nowrap text-foreground uppercase select-none"
        style={{ fontSize: "25.2cqi", fontKerning: "none" }}
      >
        Chestly Ace
      </span>
    </div>
  );
}
