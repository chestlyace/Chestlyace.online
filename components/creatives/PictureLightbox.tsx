"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useCallback, useEffect, useRef, type PointerEvent } from "react";
import { responsiveImage } from "@/lib/cloudinary";
import type { PublicEvent } from "@/lib/creatives/data";
import { prefersReducedMotionNow } from "@/lib/media";

type Picture = PublicEvent["images"][number];

const WIDTHS = [800, 1200, 1600, 2400];
const EASE = "cubic-bezier(0.77, 0, 0.175, 1)";
const pad = (n: number) => String(n).padStart(2, "0");

// The lightbox for an event's pictures (design.md §13.55): the picture full size with
// its caption, a counter, previous/next (← →, buttons, a swipe) and a close button.
// There is no details panel: the event's own sidebar is on the page behind. A native
// `<dialog>`: focus is trapped, Escape closes, and closing returns focus to the tile.
export function PictureLightbox({
  title,
  pictures,
  index,
  origin,
  onStep,
  onClose,
}: {
  title: string;
  pictures: readonly Picture[];
  index: number;
  origin: DOMRect | null;
  onStep: (index: number) => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const flown = useRef(false);
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const picture = pictures[index];
  const sources = responsiveImage(picture.url, WIDTHS);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    element.showModal();
    const html = document.documentElement;
    const before = html.style.overflow;
    html.style.overflow = "hidden";
    if (!prefersReducedMotionNow()) {
      element.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: 200,
        easing: "ease-out",
      });
    }
    return () => {
      html.style.overflow = before;
      if (element.open) element.close();
    };
  }, []);

  // The picture flies in from its tile.
  useEffect(() => {
    if (flown.current) return;
    flown.current = true;
    const img = stage.current?.querySelector("img");
    if (!img || !origin || prefersReducedMotionNow()) return;
    const to = img.getBoundingClientRect();
    if (to.width === 0 || to.height === 0) return;
    img.animate(
      [
        {
          transformOrigin: "top left",
          transform: `translate(${origin.left - to.left}px, ${origin.top - to.top}px) scale(${origin.width / to.width}, ${origin.height / to.height})`,
        },
        { transformOrigin: "top left", transform: "none" },
      ],
      { duration: 500, easing: EASE },
    );
  }, [origin]);

  const close = useCallback(() => {
    const img = stage.current?.querySelector("img");
    const tile = document.querySelector<HTMLElement>(
      `[data-picture="${index}"] button`,
    );
    const done = () => {
      dialog.current?.close();
      tile?.focus({ preventScroll: true });
      onClose();
    };
    if (!img || prefersReducedMotionNow()) {
      done();
      return;
    }
    const from = img.getBoundingClientRect();
    const to = tile?.getBoundingClientRect();
    const animation = to
      ? img.animate(
          [
            { transformOrigin: "top left", transform: "none" },
            {
              transformOrigin: "top left",
              transform: `translate(${to.left - from.left}px, ${to.top - from.top}px) scale(${to.width / from.width}, ${to.height / from.height})`,
            },
          ],
          { duration: 400, easing: EASE, fill: "forwards" },
        )
      : img.animate([{ opacity: 1 }, { opacity: 0 }], {
          duration: 150,
          fill: "forwards",
        });
    dialog.current?.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: 400,
      easing: "ease-in-out",
      fill: "forwards",
    });
    animation.onfinish = done;
  }, [index, onClose]);

  const step = (by: number) => {
    const next = (index + by + pictures.length) % pictures.length;
    if (next !== index) onStep(next);
  };
  const stepRef = useRef(step);
  useEffect(() => {
    stepRef.current = step;
  });
  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        stepRef.current(1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        stepRef.current(-1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const onPointerDown = (event: PointerEvent) => {
    if (event.pointerType === "touch")
      swipe.current = { x: event.clientX, y: event.clientY };
  };
  const onPointerUp = (event: PointerEvent) => {
    const start = swipe.current;
    swipe.current = null;
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) step(dx < 0 ? 1 : -1);
    else if (dy > 90 && dy > Math.abs(dx)) close();
  };

  // The neighbours are fetched ahead of time.
  const nextUrl = pictures[(index + 1) % pictures.length].url;
  const previousUrl =
    pictures[(index - 1 + pictures.length) % pictures.length].url;
  useEffect(() => {
    for (const url of [nextUrl, previousUrl])
      new Image().src = responsiveImage(url, WIDTHS).src;
  }, [nextUrl, previousUrl]);

  return (
    <dialog
      ref={dialog}
      aria-label={`${title}, picture ${index + 1} of ${pictures.length}`}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
      className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none overflow-hidden bg-[rgb(10_10_10/0.94)] p-0 text-[#f5f5f7] backdrop:bg-transparent"
    >
      <div className="grid h-dvh grid-rows-[minmax(0,1fr)_auto]">
        <div
          ref={stage}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onClick={(event) => {
            if (event.target === event.currentTarget) close();
          }}
          className="relative flex min-h-0 items-center justify-center p-6 pt-16"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- Cloudinary, sized by srcset */}
          <img
            key={picture.url}
            src={sources.src}
            srcSet={sources.srcSet}
            sizes="100vw"
            width={picture.width}
            height={picture.height}
            alt={picture.alt}
            className="max-h-full max-w-full object-contain select-none"
            style={{ aspectRatio: `${picture.width} / ${picture.height}` }}
            draggable={false}
          />
          {pictures.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous picture"
                onClick={() => step(-1)}
                className="absolute top-1/2 left-3 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-black/40 hover:bg-black/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <ChevronLeft className="size-5" aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label="Next picture"
                onClick={() => step(1)}
                className="absolute top-1/2 right-3 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-black/40 hover:bg-black/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <ChevronRight className="size-5" aria-hidden="true" />
              </button>
            </>
          )}
        </div>
        <p className="min-h-14 px-6 pt-2 pb-5 text-center text-sm text-[#d1d1d6]">
          {picture.caption}
        </p>
      </div>
      <p
        aria-live="polite"
        className="type-label fixed top-3 left-3 rounded-full bg-black/40 px-3 py-2 text-[#f5f5f7]"
      >
        {pad(index + 1)} / {pad(pictures.length)}
      </p>
      <button
        type="button"
        aria-label="Close"
        onClick={close}
        className="fixed top-3 right-3 z-10 grid size-11 place-items-center rounded-full bg-black/40 hover:bg-black/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <X className="size-5" aria-hidden="true" />
      </button>
    </dialog>
  );
}
