"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { prefersReducedMotionNow, usePrefersReducedMotion } from "@/lib/media";
import { boxOf, createOverlay, flyOverlay, takeMorph } from "@/lib/morph";

const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

// The Projects grid's scroll motion (design.md §13.10, §14.5):
//  - entrance: each tile's image reveals upward while it settles from 115%, then
//    the label and title rise — batched per row, once;
//  - parallax: inside its frame each image drifts ±5% as the page scrolls.
// The HTML is complete without JavaScript; the hidden start state is applied
// once it runs, and reduced motion leaves everything as it is.
export function ProjectsGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLUListElement>(null);

  useIsomorphicLayoutEffect(() => {
    const list = ref.current;
    if (reduced || prefersReducedMotionNow() || !list) return;
    gsap.registerPlugin(ScrollTrigger);

    // Coming back from a project page: its image flies into this project's card
    // (design.md §14.10). That card skips its own entrance.
    const back = takeMorph("close");
    let overlay: HTMLElement | undefined;
    let flight: gsap.core.Tween | undefined;
    let settle = 0;
    if (back) {
      overlay = createOverlay(back.src, back.box, back.radius);
      // The page scrolls to #projects as it arrives; wait for the card to stop
      // moving, then fly. A card that isn't on screen just gets a fade.
      const target = () =>
        list.querySelector<HTMLElement>(
          `[data-card][data-slug="${CSS.escape(back.slug)}"] [data-card-media]`,
        );
      let last = "";
      let still = 0;
      const started = performance.now();
      const watch = () => {
        const media = target();
        const key = media ? JSON.stringify(boxOf(media)) : "";
        still = key === last ? still + 1 : 0;
        last = key;
        const timedOut = performance.now() - started > 900;
        if (media && (still >= 3 || timedOut)) {
          const box = boxOf(media);
          const visible = box.y < window.innerHeight && box.y + box.height > 0;
          if (visible && overlay) {
            flight = flyOverlay(overlay, box, 20, () => {});
          } else if (overlay) {
            flight = gsap.to(overlay, {
              opacity: 0,
              duration: 0.3,
              onComplete: () => overlay?.remove(),
            });
          }
          return;
        }
        if (timedOut) {
          overlay?.remove();
          return;
        }
        settle = requestAnimationFrame(watch);
      };
      settle = requestAnimationFrame(watch);
    }

    let context: gsap.Context | undefined;
    try {
      context = gsap.context(() => {
        const cards = Array.from(
          list.querySelectorAll<HTMLElement>("[data-card]"),
        ).filter((card) => !back || card.dataset.slug !== back.slug);
        const parts = (card: HTMLElement) => ({
          media: card.querySelector<HTMLElement>("[data-card-media]"),
          image: card.querySelector<HTMLElement>("[data-card-image]"),
          text: card.querySelector<HTMLElement>("[data-card-text]"),
        });

        // Start state.
        cards.forEach((card) => {
          const { media, image, text } = parts(card);
          if (media) gsap.set(media, { clipPath: "inset(100% 0% 0% 0%)" });
          if (image) gsap.set(image, { scale: 1.15 });
          if (text) gsap.set(text, { opacity: 0, y: 16 });
        });

        ScrollTrigger.batch(cards, {
          start: "top 88%",
          once: true,
          onEnter: (batch) => {
            batch.forEach((card, i) => {
              const { media, image, text } = parts(card as HTMLElement);
              const delay = i * 0.1;
              if (media) {
                gsap.fromTo(
                  media,
                  { clipPath: "inset(100% 0% 0% 0%)" },
                  {
                    clipPath: "inset(0% 0% 0% 0%)",
                    duration: 0.9,
                    ease: "expo.out",
                    delay,
                    onComplete: () =>
                      gsap.set(media, { clearProps: "clipPath" }),
                  },
                );
              }
              if (image) {
                gsap.fromTo(
                  image,
                  { scale: 1.15 },
                  { scale: 1, duration: 0.9, ease: "expo.out", delay },
                );
              }
              if (text) {
                gsap.fromTo(
                  text,
                  { opacity: 0, y: 16 },
                  {
                    opacity: 1,
                    y: 0,
                    duration: 0.6,
                    ease: "power3.out",
                    delay: delay + 0.08,
                  },
                );
              }
            });
          },
        });

        // Parallax: the image box is 110% of the frame, so ±4.5% of its own
        // height is ±5% of the frame.
        cards.forEach((card) => {
          const { media, image } = parts(card);
          if (!media || !image) return;
          gsap.fromTo(
            image,
            { yPercent: -4.5 },
            {
              yPercent: 4.5,
              ease: "none",
              scrollTrigger: {
                trigger: media,
                start: "top bottom",
                end: "bottom top",
                scrub: true,
              },
            },
          );
        });
      }, list);
    } catch (error) {
      console.error("Projects grid motion failed", error);
      context?.revert();
      cancelAnimationFrame(settle);
      overlay?.remove();
      return;
    }
    return () => {
      cancelAnimationFrame(settle);
      flight?.kill();
      overlay?.remove();
      context?.revert();
    };
  }, [reduced]);

  return (
    <ul ref={ref} className={className}>
      {children}
    </ul>
  );
}
