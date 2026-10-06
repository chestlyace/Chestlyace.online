"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import { useEffect, useLayoutEffect, useRef } from "react";
import type { ImageSource } from "@/lib/hero";
import { prefersReducedMotionNow, usePrefersReducedMotion } from "@/lib/media";

const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

// One gallery image (design.md §14.10): full width, radius `lg`; inside its
// frame the image drifts ±4% as the page scrolls. The frame is 16:9; the image
// box is 108% of it so the drift never shows an edge.
export function GalleryImage({
  image,
  alt,
}: {
  image: ImageSource;
  alt: string;
}) {
  const reduced = usePrefersReducedMotion();
  const frameRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useIsomorphicLayoutEffect(() => {
    const frame = frameRef.current;
    const inner = innerRef.current;
    if (reduced || prefersReducedMotionNow() || !frame || !inner) return;
    gsap.registerPlugin(ScrollTrigger);

    let context: gsap.Context | undefined;
    try {
      context = gsap.context(() => {
        // ±4% of the frame is ±3.7% of the 108% box.
        gsap.fromTo(
          inner,
          { yPercent: -3.7 },
          {
            yPercent: 3.7,
            ease: "none",
            scrollTrigger: {
              trigger: frame,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          },
        );
      }, frame);
    } catch (error) {
      console.error("Gallery parallax failed", error);
      context?.revert();
      return;
    }
    return () => context?.revert();
  }, [reduced]);

  if (image.kind === "none") return null;
  return (
    <div
      ref={frameRef}
      className="relative aspect-[16/9] overflow-hidden rounded-lg bg-tile"
    >
      <div ref={innerRef} className="absolute inset-x-0 -top-[4%] h-[108%]">
        {image.kind === "local" ? (
          <Image
            src={image.src}
            alt={alt}
            fill
            sizes="(min-width: 1280px) 1216px, 100vw"
            className="object-cover"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image.src}
            alt={alt}
            loading="lazy"
            decoding="async"
            className="size-full object-cover"
          />
        )}
      </div>
    </div>
  );
}
