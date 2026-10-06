"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Tag } from "@/components/shared/Tag";
import { TextLink } from "@/components/shared/TextLink";
import { useSmoothScroll } from "@/components/shared/SmoothScroll";
import type { HomepageData } from "@/lib/db";
import { imageSource } from "@/lib/hero";
import { isHttpUrl } from "@/lib/links";
import { usePrefersMotion } from "@/lib/media";
import { EASE_OUT } from "@/lib/motion";
import { timelineDateTime, timelineDates } from "@/lib/timeline";
import {
  activeEntry,
  indexToProgress,
  progressToIndex,
  wheelLook,
} from "@/lib/wheel";

// Journey rows carry a `type` (education entries get a tag); volunteering rows
// don't have one.
export type TimelineEntry =
  HomepageData["experience"][number] | HomepageData["volunteering"][number];

const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

// Distance the capsule header takes from the top of the screen (design.md §14.0).
const PIN_TOP = 96;
// Scroll distance per entry, as a share of the viewport's height.
const STEP_VH = 60;

const isEducation = (entry: TimelineEntry) =>
  "type" in entry && entry.type === "education";

// The organization's logo in a 40px square. Entries without one show the
// organization's first letter, so every card has the same shape.
function Logo({ url, name }: { url: string | null; name: string }) {
  const image = imageSource(url);
  return (
    <span
      aria-hidden="true"
      className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-tile-hover"
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

// What one entry says: role, organization, place, description.
function EntryText({ entry }: { entry: TimelineEntry }) {
  const link = entry.linkUrl && isHttpUrl(entry.linkUrl) ? entry.linkUrl : null;
  return (
    <>
      <h3 className="text-h3 text-foreground">{entry.role}</h3>
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
        <p className="mt-4 max-w-[60ch] text-body text-muted">
          {entry.description}
        </p>
      )}
    </>
  );
}

function Dates({ entry }: { entry: TimelineEntry }) {
  const dates = timelineDates(entry);
  if (!dates) return null;
  return <time dateTime={timelineDateTime(entry)}>{dates}</time>;
}

// The plain version: every entry in a list. It is what the server renders, and
// what stays for reduced motion, no JavaScript, and a single entry.
function EntryList({
  entries,
  label,
}: {
  entries: readonly TimelineEntry[];
  label: string;
}) {
  return (
    <ol aria-label={label} className="border-t border-border">
      {entries.map((entry) => (
        <li
          key={entry.id}
          className="flex gap-5 border-b border-border py-8 md:py-10"
        >
          <Logo url={entry.logoUrl} name={entry.organization} />
          <div className="min-w-0">
            <p className="type-label mb-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-muted">
              <Dates entry={entry} />
              {isEducation(entry) && <Tag>Education</Tag>}
            </p>
            <EntryText entry={entry} />
          </div>
        </li>
      ))}
    </ol>
  );
}

// Experience and Volunteering (design.md §13.13): a date-picker wheel. The
// section pins to the screen while the visitor scrolls; the entries roll past a
// fixed spotlight, the one in it is shown in full on the card beside them, and
// when the last one has had its turn the page moves on to the next section.
export function ExperienceWheel({
  entries,
  label,
}: {
  entries: readonly TimelineEntry[];
  /** Names the list for screen readers, e.g. "Experience". */
  label: string;
}) {
  const count = entries.length;
  const motionAllowed = usePrefersMotion();
  const wheel = motionAllowed && count > 1;

  if (!wheel) return <EntryList entries={entries} label={label} />;
  return <Wheel entries={entries} label={label} />;
}

function Wheel({
  entries,
  label,
}: {
  entries: readonly TimelineEntry[];
  label: string;
}) {
  const count = entries.length;
  const { scrollToY } = useSmoothScroll();
  const trackRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const positionRef = useRef(0);
  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState(1);

  // Puts every row where the scroll position says: `position` rows from the
  // first entry. The row nearest the spotlight is full size and colour.
  const render = useCallback(
    (position: number) => {
      const rows = itemRefs.current;
      const height = rows[0]?.offsetHeight ?? 0;
      rows.forEach((row, i) => {
        if (!row) return;
        const { opacity, scale } = wheelLook(i - position);
        row.style.transform = `translateY(calc(-50% + ${(i - position) * height}px)) scale(${scale})`;
        row.style.opacity = String(opacity);
      });
      const next = activeEntry(position, count);
      setActive((current) => {
        if (current !== next) setDirection(next > current ? 1 : -1);
        return next;
      });
    },
    [count],
  );

  useIsomorphicLayoutEffect(() => {
    const track = trackRef.current;
    const stage = stageRef.current;
    if (!track || !stage) return;
    gsap.registerPlugin(ScrollTrigger);

    render(0);
    let context: gsap.Context | undefined;
    try {
      context = gsap.context(() => {
        const proxy = { position: 0 };
        // The scrub smooths the position, so the wheel glides to a stop after
        // the visitor stops scrolling.
        gsap.to(proxy, {
          position: count - 1,
          ease: "none",
          scrollTrigger: {
            trigger: track,
            start: `top top+=${PIN_TOP}`,
            end: () => `+=${track.offsetHeight - stage.offsetHeight}`,
            scrub: 0.4,
            invalidateOnRefresh: true,
          },
          onUpdate: () => {
            // `proxy.position` runs 0 → count-1 linearly with progress; the
            // dwell mapping is applied on top of it.
            const progress = count > 1 ? proxy.position / (count - 1) : 0;
            positionRef.current = progressToIndex(progress, count);
            render(positionRef.current);
          },
        });
      }, track);
    } catch (error) {
      console.error("Experience wheel failed", error);
      context?.revert();
      return;
    }
    const onResize = () => render(positionRef.current);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      context?.revert();
    };
  }, [count, render]);

  // Clicking a row scrolls to the spot where that entry is in the spotlight.
  const goTo = (index: number) => {
    const track = trackRef.current;
    const stage = stageRef.current;
    if (!track || !stage) return;
    const trackTop = track.getBoundingClientRect().top + window.scrollY;
    const distance = track.offsetHeight - stage.offsetHeight;
    scrollToY(trackTop - PIN_TOP + indexToProgress(index, count) * distance);
  };

  const entry = entries[active];

  return (
    <div
      ref={trackRef}
      style={{
        height: `calc(100svh - ${PIN_TOP + 16}px + ${(count - 1) * STEP_VH}svh)`,
      }}
    >
      <div
        ref={stageRef}
        style={{ top: PIN_TOP, height: `calc(100svh - ${PIN_TOP + 16}px)` }}
        className="sticky grid min-h-[30rem] grid-rows-[minmax(0,2fr)_minmax(0,3fr)] gap-6 [--wheel-row:4.25rem] lg:grid-cols-12 lg:grid-rows-1 lg:gap-12 lg:[--wheel-row:6.5rem]"
      >
        {/* The wheel */}
        <div className="relative min-h-0 [mask-image:linear-gradient(to_bottom,transparent,black_28%,black_72%,transparent)] lg:col-span-5">
          <ol aria-label={label} className="absolute inset-0">
            {entries.map((item, i) => (
              <li
                key={item.id}
                ref={(node) => {
                  itemRefs.current[i] = node;
                }}
                className="absolute inset-x-0 top-1/2 h-(--wheel-row) origin-left will-change-transform"
              >
                <button
                  type="button"
                  onClick={() => goTo(i)}
                  aria-current={i === active ? "step" : undefined}
                  className="flex size-full flex-col justify-center rounded-md text-left"
                >
                  <span className="font-display text-title font-normal uppercase leading-none text-foreground">
                    {timelineDates(item) || item.role}
                  </span>
                  <span className="type-label mt-1.5 truncate text-muted">
                    {item.role}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </div>

        {/* The spotlight: the entry in full */}
        <div className="flex min-h-0 items-center lg:col-span-7">
          <div className="w-full rounded-xl bg-tile p-6 md:p-8">
            <p className="type-label mb-5 flex items-center gap-3 text-muted">
              <span aria-hidden="true">
                {String(active + 1).padStart(2, "0")} /{" "}
                {String(count).padStart(2, "0")}
              </span>
              {isEducation(entry) && (
                <Tag className="bg-tile-hover">Education</Tag>
              )}
            </p>
            <AnimatePresence mode="wait" initial={false} custom={direction}>
              <motion.div
                key={entry.id}
                custom={direction}
                initial={{ opacity: 0, y: 14 * direction }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 * direction }}
                transition={{ duration: 0.22, ease: EASE_OUT }}
                className="flex gap-5"
              >
                <Logo url={entry.logoUrl} name={entry.organization} />
                <div className="min-w-0">
                  <p className="type-label mb-3 text-muted">
                    <Dates entry={entry} />
                  </p>
                  <EntryText entry={entry} />
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
