"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { prefersReducedMotionNow, usePrefersReducedMotion } from "@/lib/media";

type SectionHeadingProps = {
  /** "02" — assigned from the sections shown (lib/sections.ts). */
  index?: string;
  /** The mono label next to the index, e.g. "SKILLS". */
  label: string;
  title: ReactNode;
  intro?: ReactNode;
  as?: "h1" | "h2";
  className?: string;
};

// useLayoutEffect on the client (so the hidden start state is set before
// paint), a no-op effect during server rendering.
const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

// Section heading (design.md §14.0): a mono index above a huge Bebas title.
// The title's letters rise from a clipping line box when the heading is 85%
// down the viewport; the label and intro fade up 100ms later. The text is in
// the HTML at full strength; the animation only starts once the heading is
// split, and reduced motion leaves it alone.
export function SectionHeading({
  index,
  label,
  title,
  intro,
  as: Heading = "h2",
  className,
}: SectionHeadingProps) {
  const reduced = usePrefersReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useIsomorphicLayoutEffect(() => {
    const root = rootRef.current;
    const heading = titleRef.current;
    if (reduced || prefersReducedMotionNow() || !root || !heading) return;
    gsap.registerPlugin(ScrollTrigger, SplitText);

    const extras = root.querySelectorAll("[data-heading-extra]");
    let context: gsap.Context | undefined;
    // A decorative animation must never be able to take the page down: if it
    // fails, the heading simply stays as plain text.
    try {
      context = gsap.context(() => {
        gsap.set(extras, { opacity: 0, y: 16 });

        SplitText.create(heading, {
          type: "lines,chars",
          mask: "lines",
          autoSplit: true,
          onSplit(split) {
            // The trigger stays alive (no `once`): SplitText re-splits when
            // fonts load or the width changes and reverts this animation first,
            // which breaks if its ScrollTrigger has already killed itself.
            const timeline = gsap.timeline({
              scrollTrigger: {
                trigger: root,
                start: "top 85%",
                toggleActions: "play none none none",
              },
            });
            timeline.from(split.chars, {
              yPercent: 105,
              duration: 0.9,
              ease: "expo.out",
              stagger: 0.03,
            });
            timeline.to(
              extras,
              { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" },
              0.1,
            );
            return timeline;
          },
        });
      }, root);
    } catch (error) {
      console.error("Section heading animation failed", error);
      context?.revert();
      gsap.set(extras, { clearProps: "all" });
      return;
    }

    return () => context?.revert();
  }, [reduced]);

  return (
    <div ref={rootRef} className={cn("max-w-3xl", className)}>
      <p data-heading-extra className="type-label mb-4 text-muted">
        {index ? `${index} — ` : ""}
        {label}
      </p>
      <Heading
        ref={titleRef}
        tabIndex={-1}
        data-section-heading
        className="font-display text-display-xl text-foreground uppercase outline-none"
      >
        {title}
      </Heading>
      {intro && (
        <p
          data-heading-extra
          className="mt-6 max-w-[52ch] text-lead text-muted"
        >
          {intro}
        </p>
      )}
    </div>
  );
}
