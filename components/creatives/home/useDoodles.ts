"use client";

import gsap from "gsap";
import { useEffect, type RefObject } from "react";

// The motion of the doodles inside `root` (design.md §13.57). The markup (Doodle and
// Frame in DoodleScene) marks what moves:
//   [data-doodle="kind"]   one doodle; inside it the layers [data-layer="field"] (the
//                          pointer field), "idle" (breathing) and "react" (a reaction)
//   [data-draw]            a path that is drawn on (pathLength 1)
//   [data-dot]             a filled dot, which fades in
//   [data-frame-image]     a frame's picture, wiped in after the frame is drawn
// Draw-on once, idle breathing, the pointer field (a fine pointer only) and a
// reaction per kind. Reduced motion and Save-Data: everything is shown at once and
// only a colour change on hover remains (a CSS class). Nothing here is needed to read
// the page: a failure leaves the doodles as they are.
const FIELD_RADIUS = 180;
const FIELD_MAX = 16;
const DRAW_START = 0.4;
const DRAW_STAGGER = 0.09;

type Doodle = {
  el: SVGGElement;
  kind: string;
  field: SVGGElement | null;
  idle: SVGGElement | null;
  react: SVGGElement | null;
  center: { x: number; y: number };
};

function saveData(): boolean {
  const connection = (
    navigator as Navigator & {
      connection?: { saveData?: boolean };
    }
  ).connection;
  return Boolean(connection?.saveData);
}

function showAll(root: Element) {
  gsap.set(root.querySelectorAll("[data-draw]"), {
    strokeDashoffset: 0,
    opacity: 1,
  });
  gsap.set(root.querySelectorAll("[data-dot]"), { opacity: 1 });
  gsap.set(root.querySelectorAll("[data-frame-image]"), { opacity: 1 });
  root
    .querySelectorAll<SVGRectElement>("[data-frame-clip]")
    .forEach((rect) => rect.setAttribute("width", rect.dataset.width ?? "0"));
}

// A reaction: the doodle's own 600ms animation; it ends in the resting pose and can be
// played again once it has ended.
function reaction(doodle: Doodle): gsap.core.Timeline | null {
  const { el, kind, react } = doodle;
  if (!react) return null;
  const part = (selector: string) => el.querySelector(selector);
  const tl = gsap.timeline({ defaults: { ease: "power2.inOut" } });
  switch (kind) {
    case "camera": {
      const burst = part(".burst");
      if (burst)
        tl.fromTo(
          burst,
          { opacity: 1, scale: 0.6 },
          { opacity: 0, scale: 1.4, duration: 0.6, ease: "power2.out" },
        );
      break;
    }
    case "aperture": {
      const blades = part(".blades");
      if (blades) tl.to(blades, { rotation: "+=60", duration: 0.6 });
      break;
    }
    case "star":
      tl.to(react, { rotation: 180, scale: 1.2, duration: 0.3 })
        .to(react, { scale: 1, duration: 0.3 })
        .set(react, { rotation: 0 });
      break;
    case "squiggle":
    case "scribble":
      tl.fromTo(
        el.querySelectorAll("[data-draw]"),
        { strokeDashoffset: 1.02 },
        { strokeDashoffset: 0, duration: 0.6 },
      );
      break;
    case "arrow":
      tl.to(react, { rotation: -8, duration: 0.12 })
        .to(react, { rotation: 8, duration: 0.2 })
        .to(react, { rotation: -4, duration: 0.15 })
        .to(react, { rotation: 0, duration: 0.13 });
      break;
    case "nib": {
      const handles = part(".handles");
      if (handles)
        tl.to(handles, { x: 7, y: -5, duration: 0.3 }).to(handles, {
          x: 0,
          y: 0,
          duration: 0.3,
        });
      break;
    }
    case "frame": {
      const tilt = Number(el.dataset.tilt ?? 0);
      const image = part("[data-frame-image]");
      tl.to(react, { rotation: -tilt, duration: 0.3 });
      if (image) tl.to(image, { filter: "brightness(1.15)", duration: 0.3 }, 0);
      tl.to(react, { rotation: 0, duration: 0.3 });
      if (image) tl.to(image, { filter: "brightness(1)", duration: 0.3 }, "<");
      break;
    }
    case "spark":
      tl.to(react, { rotation: 90, scale: 1.3, duration: 0.3 }).to(react, {
        rotation: 0,
        scale: 1,
        duration: 0.3,
      });
      break;
    default:
      tl.to(react, { rotation: -10, scale: 1.08, duration: 0.2 })
        .to(react, { rotation: 8, duration: 0.2 })
        .to(react, { rotation: 0, scale: 1, duration: 0.2 });
  }
  return tl;
}

export function useDoodles(root: RefObject<Element | null>) {
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const reduced =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      saveData();
    if (reduced) {
      showAll(element);
      return;
    }

    const fine = window.matchMedia(
      "(hover: hover) and (pointer: fine)",
    ).matches;
    const doodles: Doodle[] = Array.from(
      element.querySelectorAll<SVGGElement>("[data-doodle]"),
    ).map((el) => ({
      el,
      kind: el.dataset.doodle ?? "",
      field: el.querySelector<SVGGElement>("[data-layer='field']"),
      idle: el.querySelector<SVGGElement>("[data-layer='idle']"),
      react: el.querySelector<SVGGElement>("[data-layer='react']"),
      center: { x: 0, y: 0 },
    }));

    const cleanups: Array<() => void> = [];
    const loops: gsap.core.Tween[] = [];
    let drawing: gsap.core.Timeline | undefined;
    try {
      // The layers turn about their own middle.
      gsap.set(element.querySelectorAll("[data-layer]"), {
        transformOrigin: "50% 50%",
        transformBox: "fill-box",
      });

      // --- Draw-on, once: each doodle in turn, its strokes a little apart; a frame's
      // picture is wiped in once its outline is drawn.
      const draw = gsap.timeline({ delay: DRAW_START });
      drawing = draw;
      doodles.forEach((doodle, index) => {
        const at = index * DRAW_STAGGER;
        const paths = doodle.el.querySelectorAll("[data-draw]");
        const dots = doodle.el.querySelectorAll("[data-dot]");
        if (paths.length)
          draw.fromTo(
            paths,
            { strokeDashoffset: 1.02, opacity: 1 },
            {
              strokeDashoffset: 0,
              duration: 0.9,
              ease: "power2.inOut",
              stagger: 0.05,
            },
            at,
          );
        if (dots.length)
          draw.to(
            dots,
            { opacity: 1, duration: 0.4, ease: "power2.out", stagger: 0.1 },
            at,
          );
        const image = doodle.el.querySelector("[data-frame-image]");
        const clip =
          doodle.el.querySelector<SVGRectElement>("[data-frame-clip]");
        if (image && clip) {
          draw.set(image, { opacity: 1 }, at + 0.9);
          draw.to(
            clip,
            {
              attr: { width: Number(clip.dataset.width ?? 0) },
              duration: 0.3,
              ease: "power2.out",
            },
            at + 0.9,
          );
        }
        // Once drawn, it breathes: ±2° and 3% scale, 4–7s, its own phase.
        if (doodle.idle) {
          const idle = doodle.idle;
          draw.call(
            () => {
              loops.push(
                gsap.fromTo(
                  idle,
                  { rotation: -2, scale: 0.985 },
                  {
                    rotation: 2,
                    scale: 1.015,
                    duration: 4 + Math.random() * 3,
                    ease: "sine.inOut",
                    repeat: -1,
                    yoyo: true,
                  },
                ),
              );
            },
            [],
            at + 1,
          );
        }
      });

      // --- Reactions: the pointer enters a doodle (or a tap on touch).
      for (const doodle of doodles) {
        let playing = false;
        const play = () => {
          if (playing) return;
          const tl = reaction(doodle);
          if (!tl) return;
          playing = true;
          tl.eventCallback("onComplete", () => {
            playing = false;
          });
        };
        const onEnter = (event: PointerEvent) => {
          if (event.pointerType === "mouse") play();
        };
        const onClick = () => play();
        doodle.el.addEventListener("pointerenter", onEnter);
        doodle.el.addEventListener("click", onClick);
        cleanups.push(() => {
          doodle.el.removeEventListener("pointerenter", onEnter);
          doodle.el.removeEventListener("click", onClick);
        });
      }

      // --- The pointer field: doodles within 180px drift away from the pointer by
      // up to 16px (more when closer) and tilt toward it.
      if (fine) {
        const setters = doodles.map((doodle) =>
          doodle.field
            ? {
                x: gsap.quickTo(doodle.field, "x", { duration: 0.5 }),
                y: gsap.quickTo(doodle.field, "y", { duration: 0.5 }),
                rotation: gsap.quickTo(doodle.field, "rotation", {
                  duration: 0.5,
                }),
              }
            : null,
        );
        const measure = () => {
          const box = element.getBoundingClientRect();
          doodles.forEach((doodle) => {
            const rect = doodle.el.getBoundingClientRect();
            doodle.center = {
              x: rect.left + rect.width / 2 - box.left,
              y: rect.top + rect.height / 2 - box.top,
            };
          });
        };
        // The centres are measured once the doodles are in place, and again when
        // the window changes.
        const measureSoon = window.setTimeout(measure, 1800);
        window.addEventListener("resize", measure);
        const onMove = (event: PointerEvent) => {
          const box = element.getBoundingClientRect();
          const px = event.clientX - box.left;
          const py = event.clientY - box.top;
          doodles.forEach((doodle, i) => {
            const set = setters[i];
            if (!set) return;
            const dx = doodle.center.x - px;
            const dy = doodle.center.y - py;
            const distance = Math.hypot(dx, dy);
            if (distance > FIELD_RADIUS || distance < 1) {
              set.x(0);
              set.y(0);
              set.rotation(0);
              return;
            }
            const strength = 1 - distance / FIELD_RADIUS;
            set.x((dx / distance) * FIELD_MAX * strength);
            set.y((dy / distance) * FIELD_MAX * strength);
            set.rotation((dx > 0 ? -1 : 1) * 6 * strength);
          });
        };
        window.addEventListener("pointermove", onMove, { passive: true });
        cleanups.push(() => {
          window.clearTimeout(measureSoon);
          window.removeEventListener("resize", measure);
          window.removeEventListener("pointermove", onMove);
        });
      }

      // --- Paused while the scene is off-screen.
      const observer = new IntersectionObserver(([entry]) => {
        const visible = entry?.isIntersecting ?? true;
        draw[visible ? "resume" : "pause"]();
        loops.forEach((loop) => loop[visible ? "resume" : "pause"]());
      });
      observer.observe(element);
      cleanups.push(() => observer.disconnect());
    } catch (error) {
      console.error("Doodle animation failed", error);
      showAll(element);
    }

    return () => {
      cleanups.forEach((run) => run());
      drawing?.kill();
      loops.forEach((loop) => loop.kill());
      gsap.killTweensOf(element.querySelectorAll("[data-layer]"));
    };
  }, [root]);
}
