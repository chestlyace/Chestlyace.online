"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
} from "react";
import { responsiveImage, thumbnailUrl } from "@/lib/cloudinary";
import type { PublicPiece } from "@/lib/creatives/data";
import { prefersReducedMotionNow } from "@/lib/media";
import { Details } from "./Details";

const WIDTHS = [800, 1200, 1600, 2400];
const EASE = "cubic-bezier(0.77, 0, 0.175, 1)";

const pad = (n: number) => String(n).padStart(2, "0");

// The lightbox (design.md §13.55): a design piece full size with its details, over
// the gallery. A native `<dialog>` (focus is trapped, Escape closes), the image on the
// left and the details on the right from `lg`, a thumbnail rail when the piece has
// several images, previous/next through the gallery's current order (← →, buttons,
// a swipe), a counter. Opens from the tile with a Flip and closes back to it; the
// click ends the journey: there is no page behind it.
export function Lightbox({
  pieces,
  slug,
  origin,
  onStep,
  onClose,
}: {
  /** The gallery's current order (the filter included). */
  pieces: readonly PublicPiece[];
  slug: string;
  /** The tile's rectangle, when it was opened by a click: what the image flies from. */
  origin: DOMRect | null;
  onStep: (slug: string) => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const flown = useRef(false);
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const [picked, setPicked] = useState<{ slug: string; index: number }>({
    slug,
    index: 0,
  });

  const index = Math.max(
    0,
    pieces.findIndex((p) => p.slug === slug),
  );
  const piece = pieces[index];
  const images = [piece.cover, ...piece.images];
  const imageIndex = picked.slug === slug ? picked.index : 0;
  const image = images[Math.min(imageIndex, images.length - 1)];
  const sources = responsiveImage(image.url, WIDTHS);

  // Opens as a modal dialog and keeps the page from scrolling behind it.
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

  // The Flip: the image starts at the tile's rectangle and settles on the stage.
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
      `[data-flip-id="${CSS.escape(slug)}"] button`,
    );
    // The dialog is closed first: while it is modal, the page behind can't take focus.
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
  }, [onClose, slug]);

  const step = (by: number) => {
    const next = pieces[(index + by + pieces.length) % pieces.length];
    if (next && next.slug !== slug) onStep(next.slug);
  };

  // ← and → anywhere in the page while it is open (the focused thumbnail may be
  // gone after a step).
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

  // The neighbours are fetched ahead of time, so stepping is instant.
  const nextUrl = pieces[(index + 1) % pieces.length].cover.url;
  const previousUrl =
    pieces[(index - 1 + pieces.length) % pieces.length].cover.url;
  useEffect(() => {
    for (const url of [nextUrl, previousUrl])
      new Image().src = responsiveImage(url, WIDTHS).src;
  }, [nextUrl, previousUrl]);

  return (
    <dialog
      ref={dialog}
      aria-label={piece.title}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
      className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none overflow-y-auto bg-[rgb(10_10_10/0.94)] p-0 text-[#f5f5f7] backdrop:bg-transparent lg:overflow-hidden"
    >
      <div className="grid min-h-dvh lg:h-dvh lg:grid-cols-[minmax(0,1fr)_22.5rem]">
        <div
          ref={stage}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          className="relative flex min-h-[60dvh] items-center justify-center p-6 pt-16 lg:min-h-0"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- Cloudinary, sized by srcset */}
          <img
            key={`${piece.slug}-${imageIndex}`}
            src={sources.src}
            srcSet={sources.srcSet}
            sizes="(min-width: 1024px) calc(100vw - 360px), 100vw"
            width={image.width}
            height={image.height}
            alt={image.alt}
            className="max-h-[calc(100dvh-8rem)] max-w-full object-contain select-none"
            style={{ aspectRatio: `${image.width} / ${image.height}` }}
            draggable={false}
          />
          {pieces.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous piece"
                onClick={() => step(-1)}
                className="absolute top-1/2 left-3 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-black/40 hover:bg-black/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <ChevronLeft className="size-5" aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label="Next piece"
                onClick={() => step(1)}
                className="absolute top-1/2 right-3 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-black/40 hover:bg-black/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <ChevronRight className="size-5" aria-hidden="true" />
              </button>
            </>
          )}

          {images.length > 1 && (
            <ul
              aria-label="Images of this piece"
              className="absolute bottom-3 left-1/2 flex max-w-[calc(100%-2rem)] -translate-x-1/2 gap-2 overflow-x-auto rounded-md bg-black/40 p-2"
            >
              {images.map((thumb, i) => (
                <li key={thumb.url}>
                  <button
                    type="button"
                    aria-label={`Image ${i + 1} of ${images.length}`}
                    aria-current={i === imageIndex}
                    onClick={() => setPicked({ slug, index: i })}
                    className="block size-12 overflow-hidden opacity-60 outline-none aria-current:opacity-100 aria-current:outline-2 aria-current:outline-offset-1 aria-current:outline-[#fb923c] focus-visible:outline-2 focus-visible:outline-ring hover:opacity-100"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- Cloudinary thumbnail */}
                    <img
                      src={thumbnailUrl(thumb.url, 96)}
                      alt=""
                      className="size-full object-cover"
                    />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <aside
          aria-label="About this piece"
          className="border-t border-white/10 p-6 lg:overflow-y-auto lg:border-t-0 lg:border-l lg:pt-20"
        >
          <h2 className="mb-6 text-h3 leading-tight">{piece.title}</h2>
          <Details
            heading="About the piece"
            rows={[
              { term: "Category", value: piece.category },
              { term: "Client", value: piece.client },
              { term: "Role", value: piece.role },
              { term: "Year", value: piece.year },
            ]}
            tags={{ term: "Tools", values: piece.tools }}
            description={piece.description}
            link={
              piece.linkUrl
                ? { href: piece.linkUrl, label: "View the project" }
                : null
            }
          />
        </aside>
      </div>

      <div className="pointer-events-none fixed top-0 right-0 left-0 flex items-center justify-between p-3 lg:right-[22.5rem]">
        <p
          aria-live="polite"
          className="type-label rounded-full bg-black/40 px-3 py-2 text-[#f5f5f7]"
        >
          {pad(index + 1)} / {pad(pieces.length)}
        </p>
      </div>
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
