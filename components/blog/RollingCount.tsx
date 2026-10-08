"use client";

import { AnimatePresence, motion } from "motion/react";
import { usePrefersReducedMotion } from "@/lib/media";

// A count that rolls to its new value (design.md §13.35: 200ms; none under reduced
// motion). `up` says which way it moved.
export function RollingCount({ value, up }: { value: number; up: boolean }) {
  const reduced = usePrefersReducedMotion();
  return (
    <span
      className="relative inline-grid h-5 min-w-[1ch] place-items-center overflow-hidden"
      aria-hidden="true"
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={reduced ? false : { y: up ? 12 : -12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={reduced ? undefined : { y: up ? -12 : 12, opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
