"use client";

import gsap from "gsap";

// The card ↔ project page morph (design.md §14.10). The browser can't carry an
// element across a route change, so the page that is leaving leaves a note (where
// the image was, and which image), and the page that arrives draws a copy of the
// image in that spot, flies it to where its own image is, and swaps it out. The
// copy is a fixed `<div>` with the image cover-fitted inside it, so its crop is
// recomputed on every frame and nothing is stretched.

export type Box = { x: number; y: number; width: number; height: number };

type Morph = {
  kind: "open" | "close";
  slug: string;
  box: Box;
  radius: number;
  src: string;
};

let pending: (Morph & { at: number }) | null = null;

export function setMorph(morph: Morph) {
  pending = { ...morph, at: Date.now() };
}

// A note is only good for the navigation that follows it.
export function takeMorph(kind: Morph["kind"], slug?: string): Morph | null {
  const note = pending;
  if (!note || note.kind !== kind) return null;
  if (slug !== undefined && note.slug !== slug) return null;
  pending = null;
  return Date.now() - note.at < 5000 ? note : null;
}

export function clearMorph() {
  pending = null;
}

export function boxOf(element: Element): Box {
  const { left, top, width, height } = element.getBoundingClientRect();
  return { x: left, y: top, width, height };
}

export function createOverlay(src: string, box: Box, radius: number) {
  const overlay = document.createElement("div");
  overlay.setAttribute("aria-hidden", "true");
  Object.assign(overlay.style, {
    position: "fixed",
    left: `${box.x}px`,
    top: `${box.y}px`,
    width: `${box.width}px`,
    height: `${box.height}px`,
    borderRadius: `${radius}px`,
    overflow: "hidden",
    zIndex: "70",
    pointerEvents: "none",
    background: "var(--surface)",
  });
  const image = document.createElement("img");
  image.src = src;
  image.alt = "";
  Object.assign(image.style, {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  });
  overlay.appendChild(image);
  document.body.appendChild(overlay);
  return overlay;
}

// 800ms ease-in-out: position, size and radius together.
export function flyOverlay(
  overlay: HTMLElement,
  to: Box,
  radius: number,
  onDone: () => void,
) {
  return gsap.to(overlay, {
    left: to.x,
    top: to.y,
    width: to.width,
    height: to.height,
    borderRadius: radius,
    duration: 0.8,
    ease: "power3.inOut",
    onComplete: () => {
      overlay.remove();
      onDone();
    },
  });
}
