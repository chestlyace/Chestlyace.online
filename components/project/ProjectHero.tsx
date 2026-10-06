"use client";

import gsap from "gsap";
import Image from "next/image";
import { useEffect, useLayoutEffect, useRef } from "react";
import type { ImageSource } from "@/lib/hero";
import { prefersReducedMotionNow, usePrefersReducedMotion } from "@/lib/media";
import { boxOf, createOverlay, flyOverlay, takeMorph } from "@/lib/morph";

const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

// The project page's hero image (design.md §14.10). Opened from a card, it is
// the card's image arriving: a copy flies from the card's box to this one, then
// is swapped for the real image, while the title and facts (`data-morph-follow`)
// fade up 150ms later. Opened any other way, the frame reveals upward as the
// cards do. Reduced motion shows it as it is.
export function ProjectHero({
  slug,
  title,
  image,
}: {
  slug: string;
  title: string;
  image: ImageSource;
}) {
  const reduced = usePrefersReducedMotion();
  const frameRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  useIsomorphicLayoutEffect(() => {
    const frame = frameRef.current;
    const inner = imageRef.current;
    if (reduced || prefersReducedMotionNow() || !frame || !inner) return;

    const follow = Array.from(
      document.querySelectorAll<HTMLElement>("[data-morph-follow]"),
    );
    const morph = takeMorph("open", slug);
    let flight: gsap.core.Tween | undefined;
    let overlay: HTMLElement | undefined;
    const tweens: gsap.core.Tween[] = [];

    try {
      if (morph) {
        // Where this frame will sit once the page is at the top.
        const here = boxOf(frame);
        const to = { ...here, y: here.y + window.scrollY };
        inner.style.opacity = "0";
        overlay = createOverlay(morph.src, morph.box, morph.radius);
        flight = flyOverlay(overlay, to, 28, () => {
          inner.style.opacity = "";
        });
        tweens.push(
          gsap.fromTo(
            follow,
            { opacity: 0, y: 16 },
            {
              opacity: 1,
              y: 0,
              duration: 0.5,
              delay: 0.15,
              ease: "power3.out",
            },
          ),
        );
      } else {
        tweens.push(
          gsap.fromTo(
            frame,
            { clipPath: "inset(100% 0% 0% 0%)" },
            {
              clipPath: "inset(0% 0% 0% 0%)",
              duration: 0.9,
              ease: "expo.out",
              onComplete: () => gsap.set(frame, { clearProps: "clipPath" }),
            },
          ),
          gsap.fromTo(
            inner,
            { scale: 1.15 },
            {
              scale: 1,
              duration: 0.9,
              ease: "expo.out",
              onComplete: () => gsap.set(inner, { clearProps: "transform" }),
            },
          ),
        );
      }
    } catch (error) {
      console.error("Project hero motion failed", error);
      overlay?.remove();
      inner.style.opacity = "";
      gsap.set([frame, inner, ...follow], { clearProps: "all" });
      return;
    }

    return () => {
      flight?.kill();
      tweens.forEach((tween) => tween.kill());
      overlay?.remove();
      inner.style.opacity = "";
    };
  }, [reduced, slug]);

  return (
    <div
      ref={frameRef}
      data-project-hero
      className="relative aspect-[16/9] overflow-hidden rounded-xl bg-tile"
    >
      <div ref={imageRef} className="absolute inset-0">
        {image.kind === "none" ? (
          <span
            aria-hidden="true"
            className="absolute inset-0 grid place-items-center p-6 text-center font-display text-display-lg text-muted uppercase"
          >
            {title}
          </span>
        ) : image.kind === "local" ? (
          <Image
            src={image.src}
            alt={`${title} — project preview`}
            fill
            priority
            sizes="(min-width: 1280px) 1216px, 100vw"
            className="object-cover"
          />
        ) : (
          // Remote hosts aren't configured for next/image; shown as is.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image.src}
            alt={`${title} — project preview`}
            className="size-full object-cover"
          />
        )}
      </div>
    </div>
  );
}
