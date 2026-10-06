"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef, type ReactNode } from "react";
import { useFinePointer, usePrefersReducedMotion } from "@/lib/media";

const LIFT_RADIUS_PX = 140;
const LIFT_MAX_PX = 12;
const LIFT_STARTS_AFTER_MS = 1600; // the entrance is over

// The hero's scroll- and pointer-driven motion (design.md §14.1, steps 4, 6, 7).
// The server markup marks its layers with data attributes:
//   data-depth="n"      cursor parallax: moves n px at the edge (negative: against
//                       the pointer, positive: with it)
//   data-lift           letters inside rise toward the cursor
//   data-exit="…"       scroll exit: headline lines, the portrait group, the
//                       fading pieces, and the scroll cue
//   data-portrait-image the portrait, which turns to colour on scroll on touch
// Everything is off with reduced motion, and the cursor effects need a precise
// pointer. A failure here leaves the static page as it is.
export function HeroMotion({
  className,
  children,
  ...rest
}: {
  className?: string;
  children: ReactNode;
  id?: string;
}) {
  const fine = useFinePointer();
  const reduced = usePrefersReducedMotion();
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (reduced || !root) return;
    gsap.registerPlugin(ScrollTrigger);

    let context: gsap.Context | undefined;
    const cleanups: Array<() => void> = [];

    try {
      context = gsap.context(() => {
        // --- Scroll exit: the headline lines drift apart, the portrait group
        // rises slower than the page, the rest fades (design.md §14.1, step 7).
        const exit = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: root,
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        });
        // Explicit start values: the elements are still in their CSS entrance
        // when this runs, so GSAP must not read "where they are now".
        exit
          .fromTo("[data-exit='line-1']", { x: 0 }, { x: "-6vw" }, 0)
          .fromTo("[data-exit='line-2']", { x: 0 }, { x: "6vw" }, 0)
          .fromTo("[data-exit='line-3']", { x: 0 }, { x: "-3vw" }, 0)
          .fromTo("[data-exit='headline']", { opacity: 1 }, { opacity: 0.3 }, 0)
          .fromTo(
            "[data-exit='portrait']",
            { yPercent: 0, scale: 1 },
            { yPercent: -8, scale: 0.96 },
            0,
          )
          .fromTo("[data-exit='fade']", { opacity: 1 }, { opacity: 0 }, 0);

        gsap.fromTo(
          "[data-exit='cue']",
          { opacity: 1 },
          {
            opacity: 0,
            ease: "none",
            scrollTrigger: {
              trigger: root,
              start: "top top",
              end: "+=80",
              scrub: true,
            },
          },
        );

        if (!fine) {
          // --- Touch: no hover, so the portrait turns to colour as it scrolls
          // to the middle of the screen.
          const image = root.querySelector<HTMLElement>(
            "[data-portrait-image]",
          );
          if (image) {
            gsap.fromTo(
              image,
              { filter: "grayscale(1) contrast(1.25)" },
              {
                filter: "grayscale(0) contrast(1.25)",
                ease: "none",
                scrollTrigger: {
                  trigger: image,
                  start: "top 80%",
                  end: "center center",
                  scrub: true,
                },
              },
            );
          }
          return;
        }

        // --- Cursor parallax: layers shift by their depth, eased (design.md
        // §14.1, step 4).
        const layers = Array.from(
          root.querySelectorAll<HTMLElement>("[data-depth]"),
        ).map((element) => ({
          depth: Number(element.dataset.depth),
          x: gsap.quickTo(element, "x", { duration: 0.5, ease: "power3.out" }),
          y: gsap.quickTo(element, "y", { duration: 0.5, ease: "power3.out" }),
        }));

        // --- Letter lift: headline letters within 140px of the pointer rise.
        const letters = Array.from(
          root.querySelectorAll<HTMLElement>("[data-lift] .hero-char"),
        ).map((element) => ({
          element,
          lift: gsap.quickTo(element, "--lift", {
            duration: 0.4,
            ease: "power3.out",
          }),
        }));

        let liftEnabled = false;
        const liftTimer = window.setTimeout(
          () => (liftEnabled = true),
          LIFT_STARTS_AFTER_MS,
        );
        cleanups.push(() => window.clearTimeout(liftTimer));

        let pending: PointerEvent | null = null;
        let frame = 0;

        const apply = () => {
          frame = 0;
          const event = pending;
          if (!event) return;
          const rect = root.getBoundingClientRect();
          const nx = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
          const ny = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
          for (const layer of layers) {
            layer.x(nx * layer.depth);
            layer.y(ny * layer.depth);
          }
          if (!liftEnabled) return;
          for (const letter of letters) {
            const box = letter.element.getBoundingClientRect();
            const distance = Math.hypot(
              event.clientX - (box.left + box.width / 2),
              event.clientY - (box.top + box.height / 2),
            );
            const t = Math.max(0, 1 - distance / LIFT_RADIUS_PX);
            letter.lift(LIFT_MAX_PX * t * t * (3 - 2 * t)); // smoothstep
          }
        };

        const onMove = (event: PointerEvent) => {
          pending = event;
          if (!frame) frame = requestAnimationFrame(apply);
        };
        const onLeave = () => {
          pending = null;
          for (const layer of layers) {
            layer.x(0);
            layer.y(0);
          }
          for (const letter of letters) letter.lift(0);
        };

        root.addEventListener("pointermove", onMove, { passive: true });
        root.addEventListener("pointerleave", onLeave);
        cleanups.push(() => {
          cancelAnimationFrame(frame);
          root.removeEventListener("pointermove", onMove);
          root.removeEventListener("pointerleave", onLeave);
        });
      }, root);
    } catch (error) {
      console.error("Hero motion failed", error);
    }

    return () => {
      cleanups.forEach((cleanup) => cleanup());
      context?.revert();
    };
  }, [fine, reduced]);

  return (
    <section ref={rootRef} className={className} {...rest}>
      {children}
    </section>
  );
}
