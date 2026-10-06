"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, type ReactNode } from "react";
import { useRef } from "react";

// The service cards' stacking (design.md §13.11). CSS makes the cards sticky (see
// `.stack-card`); this scrubs the covered card to scale 0.94 and dim by 40% as
// the next one slides over it. Only where there is room (640px of height) and
// motion is allowed — otherwise the cards are a plain list.
export function ServiceStack({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const list = ref.current;
    if (!list) return;
    gsap.registerPlugin(ScrollTrigger);

    let media: gsap.MatchMedia | undefined;
    try {
      media = gsap.matchMedia();
      media.add(
        "(min-height: 640px) and (prefers-reduced-motion: no-preference)",
        () => {
          const cards = Array.from(
            list.querySelectorAll<HTMLElement>("[data-stack-card]"),
          );
          cards.slice(0, -1).forEach((card, i) => {
            const next = cards[i + 1];
            const dim = card.querySelector<HTMLElement>("[data-stack-dim]");
            const trigger = {
              trigger: next,
              start: "top bottom",
              // Until the next card reaches its own sticky position.
              end: () => `top ${parseFloat(getComputedStyle(next).top) || 0}px`,
              scrub: true,
            };
            gsap.fromTo(
              card,
              { scale: 1 },
              { scale: 0.94, ease: "none", scrollTrigger: trigger },
            );
            if (dim) {
              gsap.fromTo(
                dim,
                { opacity: 0 },
                { opacity: 0.4, ease: "none", scrollTrigger: trigger },
              );
            }
          });
        },
      );
    } catch (error) {
      console.error("Service stack failed", error);
      media?.revert();
      return;
    }
    return () => media?.revert();
  }, []);

  return (
    <ol ref={ref} className={className}>
      {children}
    </ol>
  );
}
