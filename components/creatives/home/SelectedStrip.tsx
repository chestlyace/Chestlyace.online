"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Link } from "@/components/shared/Link";
import { useEffect, useRef } from "react";
import { placeholderUrl, resizedUrl } from "@/lib/cloudinary";
import type { FeaturedWork } from "@/lib/creatives/home";
import { tileRatio } from "@/lib/creatives/gallery";

const HEIGHT = 360;
const pad = (n: number) => String(n).padStart(2, "0");

// The selected work (design.md §14.20, item 4): the featured pieces and events as a
// strip of tiles at a fixed 360px height. From `lg` with a mouse and motion the section
// pins and the tiles slide left as you scroll (GSAP ScrollTrigger scrub); everywhere
// else it is a plain horizontal scroll-snap row. A counter ("03 / 08") and a thin
// accent bar show the position either way. A tile opens its piece in the gallery's
// lightbox (`/design?piece=…`) or the event's page.
export function SelectedStrip({ work }: { work: FeaturedWork[] }) {
  const section = useRef<HTMLDivElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLUListElement>(null);
  const counter = useRef<HTMLParagraphElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const total = work.length;

  useEffect(() => {
    const frame = section.current;
    const scroller = viewport.current;
    const strip = track.current;
    if (!frame || !scroller || !strip) return;
    gsap.registerPlugin(ScrollTrigger);

    const show = (progress: number) => {
      const clamped = Math.min(1, Math.max(0, progress));
      const index = Math.round(clamped * (total - 1)) + 1;
      if (counter.current)
        counter.current.textContent = `${pad(index)} / ${pad(total)}`;
      if (bar.current) bar.current.style.transform = `scaleX(${clamped})`;
    };

    // The row's own scrolling: the position shown follows it.
    const onScroll = () => {
      const max = scroller.scrollWidth - scroller.clientWidth;
      show(max > 0 ? scroller.scrollLeft / max : 0);
    };
    scroller.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    const media = gsap.matchMedia();
    media.add(
      "(min-width: 1024px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
      () => {
        // Pinned: the row stops scrolling by hand and the tiles slide with the page.
        scroller.style.overflowX = "hidden";
        const distance = () =>
          Math.max(0, strip.scrollWidth - scroller.clientWidth);
        gsap.to(strip, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: frame,
            start: "top top+=96",
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 0.6,
            invalidateOnRefresh: true,
            onUpdate: (self) => show(self.progress),
          },
        });
        return () => {
          scroller.style.overflowX = "";
        };
      },
    );

    return () => {
      scroller.removeEventListener("scroll", onScroll);
      media.revert();
      gsap.set(strip, { clearProps: "x" });
    };
  }, [total]);

  return (
    <div ref={section} className="py-4">
      <div
        ref={viewport}
        tabIndex={0}
        aria-label="Selected work, scroll sideways"
        className="overflow-x-auto overscroll-x-contain scroll-pl-4 snap-x snap-mandatory px-4 pb-4 outline-none focus-visible:outline-2 focus-visible:outline-ring sm:scroll-pl-6 sm:px-6 lg:scroll-pl-8 lg:px-8"
      >
        <ul ref={track} className="flex w-max gap-3">
          {work.map((item, index) => {
            const ratio = tileRatio(item.image.width, item.image.height);
            const placeholder = placeholderUrl(item.image.url);
            return (
              <li
                key={`${item.kind}-${item.slug}`}
                style={{ width: Math.round(HEIGHT * ratio), height: HEIGHT }}
                className="shrink-0 snap-start"
              >
                <Link
                  href={item.href}
                  aria-label={`${item.title}, ${item.kind === "design" ? "graphic design" : "photography"}`}
                  style={{
                    backgroundImage: placeholder
                      ? `url(${placeholder})`
                      : undefined,
                    backgroundSize: "cover",
                  }}
                  className="group relative block size-full overflow-hidden bg-tile outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- Cloudinary, sized by the URL */}
                  <img
                    src={resizedUrl(item.image.url, 900)}
                    width={item.image.width}
                    height={item.image.height}
                    alt=""
                    loading={index < 3 ? "eager" : "lazy"}
                    decoding="async"
                    draggable={false}
                    className="absolute inset-0 size-full object-cover transition-transform duration-500 ease-out motion-reduce:transition-none [@media(hover:hover)]:group-hover:scale-[1.04]"
                  />
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-black/65 to-transparent"
                  />
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 grid gap-1 p-5 text-[#f5f5f7]"
                  >
                    <span className="text-h3 leading-tight">{item.title}</span>
                    <span className="type-label text-[#d1d1d6]">
                      {item.kind === "design"
                        ? "Graphic design"
                        : "Photography"}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="mx-auto mt-6 flex w-full max-w-[calc(1280px+4rem)] items-center gap-4 px-4 sm:px-6 lg:px-8">
        <p
          ref={counter}
          aria-hidden="true"
          className="type-label min-w-[5.5ch] text-muted"
        >
          {`${pad(1)} / ${pad(total)}`}
        </p>
        <span aria-hidden="true" className="h-px flex-1 bg-border">
          <span
            ref={bar}
            className="block h-px origin-left bg-primary"
            style={{ transform: "scaleX(0)" }}
          />
        </span>
      </div>
    </div>
  );
}
