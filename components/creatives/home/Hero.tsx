"use client";

import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { useEffect, useRef } from "react";
import { Button } from "@/components/shared/Button";
import { prefersReducedMotionNow } from "@/lib/media";
import { Doodle } from "./Doodle";
import { DoodleSceneLazy } from "./DoodleSceneLazy";
import { useDoodles } from "./useDoodles";

// The creatives home page's hero (design.md §14.20, item 1): the statement in Bebas at
// `display-2xl`, centred, in two lines ("DESIGN" and "& PHOTOGRAPHY"), the hero line
// and two buttons, over the full-screen doodle scene (§13.57). The text and buttons
// are in the HTML from the first paint; the scene loads after. The three doodles that
// belong to the text (the squiggle under the "&", the scribble round the second line,
// the arrow to the button) are drawn here, where the text is, so they line up with it.
export function Hero({
  lines,
  line,
  pictures,
  workHref,
}: {
  /** The statement split for two lines. */
  lines: string[];
  line: string;
  pictures: { url: string; alt: string }[];
  workHref: string;
}) {
  const content = useRef<HTMLDivElement>(null);
  useDoodles(content);

  // The statement's letters rise (900ms, expo.out, 30ms apart); the line and the
  // buttons follow (design.md §14.20, Motion).
  useEffect(() => {
    const root = content.current;
    if (!root || prefersReducedMotionNow()) return;
    gsap.registerPlugin(SplitText);
    const extras = root.querySelectorAll("[data-hero-extra]");
    let context: gsap.Context | undefined;
    try {
      context = gsap.context(() => {
        gsap.set(extras, { opacity: 0, y: 16 });
        SplitText.create(root.querySelectorAll("[data-line-text]"), {
          type: "lines,chars",
          mask: "lines",
          autoSplit: true,
          onSplit(split) {
            const timeline = gsap.timeline();
            timeline.from(split.chars, {
              yPercent: 105,
              duration: 0.9,
              ease: "expo.out",
              stagger: 0.03,
            });
            timeline.to(
              extras,
              {
                opacity: 1,
                y: 0,
                duration: 0.6,
                ease: "power3.out",
                stagger: 0.1,
              },
              0.5,
            );
            return timeline;
          },
        });
      }, root);
    } catch (error) {
      console.error("Hero animation failed", error);
      context?.revert();
      gsap.set(extras, { clearProps: "all" });
      return;
    }
    return () => context?.revert();
  }, []);

  return (
    <section
      aria-labelledby="creatives-hero"
      className="relative isolate flex min-h-svh items-center justify-center overflow-hidden"
    >
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <DoodleSceneLazy pictures={pictures} />
      </div>
      <div
        ref={content}
        className="pointer-events-none flex flex-col items-center px-4 pt-28 pb-16 text-center"
      >
        <h1
          id="creatives-hero"
          className="font-display pointer-events-auto text-display-xl text-foreground uppercase md:text-display-2xl"
        >
          {lines.map((text, index) => (
            <span key={text} className="relative block w-fit mx-auto">
              <span data-line-text className="block">
                {text}
              </span>
              {lines.length === 2 && index === 1 && (
                <>
                  <svg
                    aria-hidden="true"
                    viewBox="-70 -20 140 40"
                    className="pointer-events-none absolute -bottom-[0.18em] left-0 h-[0.28em] w-[0.7em] overflow-visible"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  >
                    <Doodle kind="squiggle" accent />
                  </svg>
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 400 100"
                    preserveAspectRatio="none"
                    className="pointer-events-none absolute -inset-x-[4%] -inset-y-[14%] h-[128%] w-[108%] overflow-visible"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  >
                    <Doodle kind="scribble" accent hit={false} />
                  </svg>
                </>
              )}
            </span>
          ))}
        </h1>
        <p
          data-hero-extra
          className="pointer-events-auto mt-6 max-w-[48ch] text-lead text-muted"
        >
          {line}
        </p>
        <div
          data-hero-extra
          className="relative mt-10 flex flex-wrap justify-center gap-3"
        >
          <svg
            aria-hidden="true"
            viewBox="-70 -60 140 90"
            className="pointer-events-none absolute top-1/2 right-full mr-6 hidden h-[4.5rem] w-28 -translate-y-1/2 overflow-visible md:block"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          >
            <Doodle kind="arrow" accent />
          </svg>
          <Button href={workHref} size="lg" className="pointer-events-auto">
            See the work
          </Button>
          <Button
            href="#contact"
            variant="secondary"
            size="lg"
            className="pointer-events-auto"
          >
            Get in touch
          </Button>
        </div>
      </div>
    </section>
  );
}
