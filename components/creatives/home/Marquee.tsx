"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Fragment, useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "@/lib/media";

const SPEED = 60; // px per second
const MAX_BOOST = 4; // the speed's cap, times SPEED
const VELOCITY_FOR_MAX = 3000; // px/s of scroll that reaches the cap

// The marquee (design.md §13.58): a line of outlined Bebas words, a small accent star
// between them, every third word filled with the accent. It drifts left at 60px/s;
// the scroll speeds it up (capped at 4×) and scrolling up reverses it, eased. Paused
// off-screen. With reduced motion the words are static, centred and wrapped. The line
// is `aria-hidden`: the same words are in the page's headings.
export function Marquee({ words }: { words: readonly string[] }) {
  const reduced = usePrefersReducedMotion();
  const root = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = root.current;
    const line = track.current;
    if (reduced || !element || !line) return;
    gsap.registerPlugin(ScrollTrigger);

    let x = 0;
    let direction = -1; // eased between -1 (left) and 1 (right)
    let target = -1;
    let boost = 1;
    let velocity = 0;
    let visible = true;

    const trigger = ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: (self) => {
        velocity = self.getVelocity();
        if (Math.abs(velocity) > 40) target = velocity > 0 ? -1 : 1;
      },
    });
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true;
    });
    observer.observe(element);

    const tick = (_time: number, deltaMs: number) => {
      if (!visible) return;
      const dt = Math.min(deltaMs, 100) / 1000;
      velocity *= 0.92; // the scroll's speed fades once it stops
      const wanted =
        1 +
        Math.min(
          MAX_BOOST - 1,
          (Math.abs(velocity) / VELOCITY_FOR_MAX) * (MAX_BOOST - 1),
        );
      const ease = 1 - Math.exp(-dt / 0.4); // about 400ms
      boost += (wanted - boost) * ease;
      direction += (target - direction) * ease;
      const half = line.scrollWidth / 2;
      x += direction * SPEED * boost * dt;
      if (half > 0) {
        if (x <= -half) x += half;
        if (x > 0) x -= half;
      }
      gsap.set(line, { x });
    };
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      trigger.kill();
      observer.disconnect();
      gsap.set(line, { clearProps: "x" });
    };
  }, [reduced]);

  const group = (copy: number) => (
    <div
      className="flex shrink-0 items-center gap-8 pr-8"
      aria-hidden={copy > 0 ? true : undefined}
    >
      {[...words, ...words].map((word, index) => (
        <Fragment key={index}>
          <span
            className={
              "font-display text-display-xl leading-none whitespace-nowrap uppercase " +
              (index % 3 === 2
                ? "text-primary-text"
                : "text-transparent [-webkit-text-stroke:1.5px_var(--foreground)]")
            }
          >
            {word}
          </span>
          <span aria-hidden="true" className="text-primary-text text-2xl">
            ✦
          </span>
        </Fragment>
      ))}
    </div>
  );

  if (reduced) {
    return (
      <div
        aria-hidden="true"
        className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 px-4 py-12 text-center"
      >
        {words.map((word, index) => (
          <span
            key={index}
            className={
              "font-display text-display-xl leading-none uppercase " +
              (index % 3 === 2
                ? "text-primary-text"
                : "text-transparent [-webkit-text-stroke:1.5px_var(--foreground)]")
            }
          >
            {word}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div ref={root} aria-hidden="true" className="overflow-hidden py-12">
      <div ref={track} className="flex w-max will-change-transform">
        {group(0)}
        {group(1)}
      </div>
    </div>
  );
}
