"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import { useEffect, useLayoutEffect, useRef } from "react";
import { Tag } from "@/components/shared/Tag";
import { TextLink } from "@/components/shared/TextLink";
import type { HomepageData } from "@/lib/db";
import { imageSource } from "@/lib/hero";
import { isHttpUrl } from "@/lib/links";
import { prefersReducedMotionNow, usePrefersReducedMotion } from "@/lib/media";
import { timelineDateTime, timelineDates } from "@/lib/timeline";

// Journey rows carry a `type` (education entries get a tag); volunteering rows
// don't have one.
export type TimelineEntry =
  HomepageData["experience"][number] | HomepageData["volunteering"][number];

const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

// The organization's logo in a 40px square. Entries without one show the
// organization's first letter, so every entry's text lines up.
function Logo({ url, name }: { url: string | null; name: string }) {
  const image = imageSource(url);
  return (
    <span
      aria-hidden="true"
      className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-tile"
    >
      {image.kind === "local" ? (
        <Image
          src={image.src}
          alt=""
          width={80}
          height={80}
          className="size-full object-contain"
        />
      ) : image.kind === "remote" ? (
        // eslint-disable-next-line @next/next/no-img-element -- remote host isn't configured for next/image
        <img src={image.src} alt="" className="size-full object-contain" />
      ) : (
        <span className="font-display text-xl text-muted">
          {name.trim().charAt(0).toUpperCase()}
        </span>
      )}
    </span>
  );
}

// A timeline (design.md §13.13): a rail with a dot per entry. The blue fill
// grows down the rail as the visitor scrolls, its tip at the middle of the
// screen, and each dot lights up as the tip reaches it. The markup is the
// finished state (filled, every dot lit), so reduced motion and no-JavaScript
// get that; with motion, an effect empties it and the scroll refills it.
export function Timeline({
  entries,
  label,
}: {
  entries: readonly TimelineEntry[];
  /** Names the list for screen readers, e.g. "Experience". */
  label: string;
}) {
  const reduced = usePrefersReducedMotion();
  const listRef = useRef<HTMLDivElement>(null);

  useIsomorphicLayoutEffect(() => {
    const list = listRef.current;
    if (reduced || prefersReducedMotionNow() || !list) return;
    gsap.registerPlugin(ScrollTrigger);

    const rail = list.querySelector<HTMLElement>("[data-rail]");
    const fill = list.querySelector<HTMLElement>("[data-rail-fill]");
    const dots = Array.from(list.querySelectorAll<HTMLElement>("[data-dot]"));
    const items = Array.from(
      list.querySelectorAll<HTMLElement>("[data-entry]"),
    );
    if (!rail || !fill || dots.length === 0) return;

    let context: gsap.Context | undefined;
    try {
      context = gsap.context(() => {
        dots.forEach((dot) => dot.removeAttribute("data-active"));

        // The rail runs from the first dot's centre to the last dot's.
        const place = () => {
          const first = dots[0].offsetTop + dots[0].offsetHeight / 2;
          const last =
            dots[dots.length - 1].offsetTop +
            dots[dots.length - 1].offsetHeight / 2;
          rail.style.top = `${first}px`;
          rail.style.bottom = "auto";
          rail.style.height = `${Math.max(last - first, 0)}px`;
        };
        place();

        // The tip stays at the middle of the viewport while the timeline passes.
        gsap.fromTo(
          fill,
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: "none",
            transformOrigin: "top center",
            scrollTrigger: {
              trigger: rail,
              start: "top 50%",
              end: "bottom 50%",
              scrub: true,
              invalidateOnRefresh: true,
              onRefreshInit: place,
            },
          },
        );

        dots.forEach((dot) => {
          ScrollTrigger.create({
            trigger: dot,
            start: "top 50%",
            onEnter: () => dot.setAttribute("data-active", ""),
            onLeaveBack: () => dot.removeAttribute("data-active"),
          });
        });

        items.forEach((item) => {
          gsap.fromTo(
            item,
            { opacity: 0, y: 24 },
            {
              opacity: 1,
              y: 0,
              duration: 0.65,
              ease: "power3.out",
              scrollTrigger: {
                trigger: item,
                start: "top 85%",
                toggleActions: "play none none none",
              },
            },
          );
        });
      }, list);
    } catch (error) {
      console.error("Timeline animation failed", error);
      context?.revert();
      dots.forEach((dot) => dot.setAttribute("data-active", ""));
      rail.removeAttribute("style");
      return;
    }

    return () => {
      context?.revert();
      // Back to the finished state, which is what the markup describes.
      dots.forEach((dot) => dot.setAttribute("data-active", ""));
      rail.removeAttribute("style");
    };
  }, [reduced, entries]);

  return (
    <div ref={listRef} className="relative">
      <span
        data-rail
        aria-hidden="true"
        className="absolute top-2 bottom-3 left-3 w-0.5 -translate-x-1/2 rounded-full bg-border"
      >
        <span
          data-rail-fill
          className="absolute inset-0 origin-top rounded-full bg-primary"
        />
      </span>
      <ol aria-label={label}>
        {entries.map((entry, index) => {
          const dates = timelineDates(entry);
          const link =
            entry.linkUrl && isHttpUrl(entry.linkUrl) ? entry.linkUrl : null;
          return (
            <li
              key={entry.id}
              className={
                index < entries.length - 1 ? "pb-12 md:pb-16" : undefined
              }
            >
              <div className="grid grid-cols-[1.5rem_1fr] gap-x-5 md:gap-x-8">
                <span
                  data-dot
                  data-active=""
                  aria-hidden="true"
                  className="timeline-dot relative z-10 mt-0.5 size-3 place-self-start justify-self-center rounded-full"
                />
                <div
                  data-entry
                  className="flex min-w-0 flex-col gap-4 sm:flex-row sm:gap-5"
                >
                  <Logo url={entry.logoUrl} name={entry.organization} />
                  <div className="min-w-0">
                    <p className="type-label flex flex-wrap items-center gap-x-3 gap-y-2 text-muted">
                      {dates && (
                        <time dateTime={timelineDateTime(entry)}>{dates}</time>
                      )}
                      {"type" in entry && entry.type === "education" && (
                        <Tag>Education</Tag>
                      )}
                    </p>
                    <h3 className="mt-3 text-h3 text-foreground">
                      {entry.role}
                    </h3>
                    <p className="mt-1 flex flex-wrap items-baseline gap-x-2 text-body font-medium text-foreground">
                      {link ? (
                        <TextLink href={link} external>
                          {entry.organization}
                        </TextLink>
                      ) : (
                        <span>{entry.organization}</span>
                      )}
                      {entry.location && (
                        <span className="text-sm font-normal text-muted">
                          {entry.location}
                        </span>
                      )}
                    </p>
                    {entry.description && (
                      <p className="mt-3 max-w-[60ch] text-body text-muted">
                        {entry.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
