"use client";

import { AnimatePresence, motion, type HTMLMotionProps } from "motion/react";
import type { ReactNode, Ref } from "react";
import { cn } from "@/lib/cn";
import { EASE_OUT } from "@/lib/motion";

type IconButtonProps = Omit<
  HTMLMotionProps<"button">,
  "children" | "aria-label"
> & {
  /** Required: icon-only buttons have no visible text (design.md §13.2). */
  label: string;
  /** Changes when the icon does, so the swap animates. */
  iconKey: string;
  children: ReactNode;
  ref?: Ref<HTMLButtonElement>;
};

// 40px circle with a 44px hit area. Icon swaps cross-fade with a small scale
// and blur; with reduced motion, opacity only (design.md §13.2).
export function IconButton({
  label,
  iconKey,
  children,
  className,
  ...rest
}: IconButtonProps) {
  // MotionConfig (Providers) strips the scale under reduced motion, leaving
  // the opacity cross-fade.
  const hidden = { opacity: 0, scale: 0.8, filter: "blur(2px)" };
  const shown = { opacity: 1, scale: 1, filter: "blur(0px)" };

  return (
    <motion.button
      type="button"
      aria-label={label}
      whileTap={{ scale: 0.94, transition: { duration: 0.12, ease: EASE_OUT } }}
      className={cn(
        "relative inline-flex size-10 shrink-0 items-center justify-center rounded-full text-foreground transition-colors duration-150 before:absolute before:-inset-0.5 before:content-[''] hover:bg-tile disabled:opacity-50",
        className,
      )}
      {...rest}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={iconKey}
          initial={hidden}
          animate={shown}
          exit={hidden}
          transition={{ duration: 0.2, ease: EASE_OUT }}
          className="inline-flex"
          aria-hidden="true"
        >
          {children}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}
