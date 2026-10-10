"use client";

import { useLayoutEffect, useRef } from "react";
import { responsiveImage } from "@/lib/cloudinary";
import type { PublicEvent } from "@/lib/creatives/data";
import { eventYear } from "@/lib/creatives/events";
import { prefersReducedMotionNow } from "@/lib/media";
import { takeFlight } from "./eventFlight";
import { useCreativesText } from "@/components/creatives/useCreativesText";

const WIDTHS = [960, 1400, 2000, 2800];

// The event page's hero (design.md §14.23): the cover across the page, the year
// top-right and the title bottom-left. Coming from an event tile, the cover grows out
// of the tile's rectangle (700ms, ease-in-out; a 200ms fade with reduced motion).
export function EventHero({ event }: { event: PublicEvent }) {
  const t = useCreativesText();
  const root = useRef<HTMLElement>(null);
  const image = responsiveImage(event.cover.url, WIDTHS);

  useLayoutEffect(() => {
    const element = root.current;
    if (!element) return;
    const from = takeFlight(event.slug);
    if (!from) return;
    if (prefersReducedMotionNow()) {
      element.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: 200,
        easing: "ease-out",
      });
      return;
    }
    const to = element.getBoundingClientRect();
    const inset = [
      Math.max(0, from.top - to.top),
      Math.max(0, to.right - (from.left + from.width)),
      Math.max(0, to.bottom - (from.top + from.height)),
      Math.max(0, from.left - to.left),
    ]
      .map((n) => `${n}px`)
      .join(" ");
    element.animate(
      [{ clipPath: `inset(${inset})` }, { clipPath: "inset(0px)" }],
      { duration: 700, easing: "cubic-bezier(0.77, 0, 0.175, 1)" },
    );
  }, [event.slug]);

  return (
    <section
      ref={root}
      aria-label={t.cover}
      className="relative h-[70svh] min-h-[22rem] w-full overflow-hidden bg-tile"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- Cloudinary, sized by srcset */}
      <img
        src={image.src}
        srcSet={image.srcSet}
        sizes="100vw"
        width={event.cover.width}
        height={event.cover.height}
        alt={event.cover.alt}
        fetchPriority="high"
        decoding="async"
        className="absolute inset-0 size-full object-cover"
      />
      <span
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-3/5 bg-linear-to-t from-black/70 to-transparent"
      />
      <p
        aria-hidden="true"
        className="type-label absolute top-24 right-4 text-[#f5f5f7] md:right-8"
      >
        {eventYear(event)}
      </p>
      <h1 className="font-display absolute bottom-0 left-0 max-w-full px-4 pb-8 text-display-xl text-[#f5f5f7] uppercase md:px-8 md:pb-12">
        {event.title}
      </h1>
    </section>
  );
}
