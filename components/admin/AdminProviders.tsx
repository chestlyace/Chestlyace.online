"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";

// Reduced motion drops transforms and keeps opacity, as on the public sites; no
// smooth scrolling here.
export function AdminProviders({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
