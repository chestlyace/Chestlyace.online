"use client";

import { useRef } from "react";
import { Doodle } from "./Doodle";
import type { DoodleKind } from "./doodleShapes";
import { useDoodles } from "./useDoodles";

const VIEW: Partial<Record<DoodleKind, string>> = {
  star: "-40 -40 80 80",
  squiggle: "-70 -20 140 40",
  spark: "-34 -34 68 68",
};

// A small doodle beside a page heading (design.md §13.57, "Doodle accents"): a star or
// a squiggle that draws itself and plays its reaction on hover.
export function HeadingDoodle({
  kind,
  className,
}: {
  kind: "star" | "squiggle" | "spark";
  className?: string;
}) {
  const root = useRef<SVGSVGElement>(null);
  useDoodles(root);
  return (
    <svg
      ref={root}
      aria-hidden="true"
      focusable="false"
      viewBox={VIEW[kind]}
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      className={
        "pointer-events-none size-14 overflow-visible md:size-20 " +
        (className ?? "")
      }
    >
      <Doodle kind={kind} accent />
    </svg>
  );
}
