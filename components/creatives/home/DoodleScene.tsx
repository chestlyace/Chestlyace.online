"use client";

import { useRef, useSyncExternalStore } from "react";
import { resizedUrl } from "@/lib/cloudinary";
import { Doodle, Frame } from "./Doodle";
import type { DoodleKind } from "./doodleShapes";
import { useDoodles } from "./useDoodles";

// The scene behind the hero (design.md §13.57): one SVG of about fourteen doodles
// and up to six frames holding featured pictures, kept clear of the statement's
// box. Wide screens use a 1440 × 900 canvas; phones a narrow 420 × 900 one with
// fewer doodles (a wide canvas would be cropped to its middle, behind the text).
type Placed = {
  kind: DoodleKind;
  x: number;
  y: number;
  rotate?: number;
  scale?: number;
  accent?: boolean;
};
type Framed = {
  x: number;
  y: number;
  width: number;
  height: number;
  rotate: number;
  polaroid?: boolean;
};

const WIDE = {
  view: "0 0 1440 900",
  frames: [
    { x: 190, y: 380, width: 190, height: 140, rotate: -6 },
    { x: 1250, y: 300, width: 150, height: 190, rotate: 5, polaroid: true },
    { x: 150, y: 640, width: 150, height: 190, rotate: 4, polaroid: true },
    { x: 1290, y: 590, width: 190, height: 140, rotate: -4 },
    { x: 620, y: 105, width: 160, height: 110, rotate: 3 },
    { x: 870, y: 815, width: 170, height: 120, rotate: -3 },
  ] satisfies Framed[],
  doodles: [
    { kind: "camera", x: 110, y: 120, scale: 1.1, rotate: -8 },
    { kind: "aperture", x: 1330, y: 110, rotate: 10 },
    { kind: "nib", x: 1320, y: 800, rotate: -6 },
    { kind: "pencil", x: 110, y: 820, scale: 1.2, rotate: 6 },
    { kind: "crop", x: 430, y: 800 },
    { kind: "star", x: 400, y: 110, accent: true },
    { kind: "star", x: 1040, y: 120, scale: 0.8, accent: true },
    { kind: "star", x: 1385, y: 450, scale: 0.7, accent: true },
    { kind: "spiral", x: 330, y: 770 },
    { kind: "spark", x: 1100, y: 785, accent: true },
    { kind: "dots", x: 560, y: 850 },
  ] satisfies Placed[],
};

const NARROW = {
  view: "0 0 420 900",
  frames: [
    { x: 95, y: 150, width: 130, height: 100, rotate: -6 },
    { x: 320, y: 235, width: 110, height: 140, rotate: 5, polaroid: true },
    { x: 100, y: 790, width: 110, height: 140, rotate: 4, polaroid: true },
    { x: 320, y: 730, width: 130, height: 100, rotate: -4 },
  ] satisfies Framed[],
  doodles: [
    { kind: "camera", x: 230, y: 60, scale: 0.8, rotate: -8 },
    { kind: "aperture", x: 385, y: 70, scale: 0.7, rotate: 10 },
    { kind: "nib", x: 225, y: 855, scale: 0.8, rotate: -6 },
    { kind: "pencil", x: 340, y: 850, scale: 0.8, rotate: 6 },
    { kind: "star", x: 30, y: 60, scale: 0.8, accent: true },
    { kind: "star", x: 190, y: 215, scale: 0.7, accent: true },
    { kind: "spark", x: 35, y: 640, scale: 0.9, accent: true },
    { kind: "dots", x: 215, y: 760 },
  ] satisfies Placed[],
};

const PHONE = "(max-width: 767.98px)";
function usePhone(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia(PHONE);
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    },
    () => window.matchMedia(PHONE).matches,
    () => false,
  );
}

function SceneSvg({
  layout,
  pictures,
}: {
  layout: typeof WIDE | typeof NARROW;
  pictures: { url: string; alt: string }[];
}) {
  const root = useRef<SVGSVGElement>(null);
  useDoodles(root);
  const frames = layout.frames.slice(0, pictures.length);
  return (
    <svg
      ref={root}
      aria-hidden="true"
      focusable="false"
      viewBox={layout.view}
      preserveAspectRatio="xMidYMid slice"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      className="pointer-events-none absolute inset-0 size-full"
    >
      {frames.map((frame, index) => (
        <Frame
          key={index}
          id={`doodle-frame-${index}`}
          src={resizedUrl(pictures[index].url, 600)}
          {...frame}
        />
      ))}
      {layout.doodles.map((doodle, index) => (
        <Doodle key={index} {...doodle} />
      ))}
    </svg>
  );
}

export default function DoodleScene({
  pictures,
}: {
  pictures: { url: string; alt: string }[];
}) {
  const phone = usePhone();
  return (
    <SceneSvg
      key={phone ? "narrow" : "wide"}
      layout={phone ? NARROW : WIDE}
      pictures={pictures}
    />
  );
}
