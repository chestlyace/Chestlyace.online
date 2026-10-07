"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { prefersReducedMotionNow, usePrefersReducedMotion } from "@/lib/media";

const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

// The post list's entrance (design.md §13.27): each cover reveals upward from a
// clip while it settles from 115%, then the meta, title and description rise
// 24px, batched, once, at 85% of the viewport. The HTML is complete without
// JavaScript; the start state is applied once it runs, and reduced motion
// leaves everything alone.
export function PostList({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLOListElement>(null);

  useIsomorphicLayoutEffect(() => {
    const list = ref.current;
    if (reduced || prefersReducedMotionNow() || !list) return;
    gsap.registerPlugin(ScrollTrigger);

    let context: gsap.Context | undefined;
    try {
      context = gsap.context(() => {
        const items = Array.from(
          list.querySelectorAll<HTMLElement>("[data-post]"),
        );
        const parts = (item: HTMLElement) => ({
          media: item.querySelector<HTMLElement>("[data-post-media]"),
          image: item.querySelector<HTMLElement>("[data-post-image]"),
          text: item.querySelector<HTMLElement>("[data-post-text]"),
        });

        items.forEach((item) => {
          const { media, image, text } = parts(item);
          if (media) gsap.set(media, { clipPath: "inset(100% 0% 0% 0%)" });
          if (image) gsap.set(image, { scale: 1.15 });
          if (text) gsap.set(text, { opacity: 0, y: 24 });
        });

        ScrollTrigger.batch(items, {
          start: "top 85%",
          once: true,
          onEnter: (batch) => {
            batch.forEach((item, i) => {
              const { media, image, text } = parts(item as HTMLElement);
              const delay = i * 0.08;
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
                gsap.to(image, {
                  scale: 1,
                  duration: 1.1,
                  ease: "expo.out",
                  delay,
                  onComplete: () =>
                    gsap.set(image, { clearProps: "transform" }),
                });
              }
              if (text) {
                gsap.to(text, {
                  opacity: 1,
                  y: 0,
                  duration: 0.65,
                  ease: "power3.out",
                  delay: delay + 0.1,
                });
              }
            });
          },
        });
      }, list);
    } catch (error) {
      console.error("Post list entrance failed", error);
      context?.revert();
      list
        .querySelectorAll(
          "[data-post-media],[data-post-image],[data-post-text]",
        )
        .forEach((element) => gsap.set(element, { clearProps: "all" }));
      return;
    }
    return () => context?.revert();
  }, [reduced]);

  return (
    <ol ref={ref} className={className}>
      {children}
    </ol>
  );
}
