"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";
import { SmoothScroll } from "./SmoothScroll";

// "user" makes Motion drop transform and layout animations when the visitor
// prefers reduced motion, keeping opacity and colour changes (design.md §8).
export function Providers({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <SmoothScroll>{children}</SmoothScroll>
    </MotionConfig>
  );
}
