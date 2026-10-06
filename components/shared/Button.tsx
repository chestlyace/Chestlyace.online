"use client";

import { LoaderCircle } from "lucide-react";
import { animate, motion, useMotionValue, useTransform } from "motion/react";
import Link from "next/link";
import {
  useEffect,
  useRef,
  type ComponentProps,
  type MouseEvent,
  type ReactNode,
} from "react";
import { cn } from "@/lib/cn";
import { useFinePointer, usePrefersReducedMotion } from "@/lib/media";
import { EASE_OUT, SPRING } from "@/lib/motion";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";
type IconNudge = "right" | "up-right" | "down" | "none";

// Pill-shaped buttons (design.md §13.1).
const base =
  "group relative inline-flex select-none items-center justify-center gap-2 rounded-full font-medium tracking-[-0.005em] whitespace-nowrap transition-colors duration-150 data-disabled:cursor-not-allowed data-disabled:opacity-40";

const variants: Record<Variant, string> = {
  primary:
    "bg-primary text-primary-foreground not-data-disabled:hover:bg-primary-hover",
  secondary:
    "border border-border bg-tile text-foreground not-data-disabled:hover:border-muted/40 not-data-disabled:hover:bg-tile-hover",
  ghost: "text-foreground not-data-disabled:hover:bg-tile",
};

// sm is 36px tall; ::before extends the tap target to 44px (design.md §10).
const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-sm [&_svg]:size-4 before:absolute before:inset-x-0 before:-inset-y-1 before:content-['']",
  md: "h-11 px-6 text-[0.9375rem] [&_svg]:size-[1.125rem]",
  lg: "h-14 px-8 text-[1.0625rem] [&_svg]:size-5",
};

const nudges: Record<IconNudge, string> = {
  right: "group-hover:translate-x-0.5",
  "up-right": "group-hover:translate-x-0.5 group-hover:-translate-y-0.5",
  down: "group-hover:translate-y-0.5",
  none: "",
};

// Magnetic pull (design.md §13.1): within 24px of the button, it moves toward
// the pointer by 35% of the offset, at most 10px; the label moves a further
// 15%. A spring brings it back when the pointer leaves.
const MARGIN = 24;
const PULL = 0.35;
const MAX_OFFSET = 10;
const LABEL_PULL = 0.15;
const PULL_SPRING = { type: "spring", bounce: 0, duration: 0.3 } as const;

function clamp(value: number, limit: number) {
  return Math.max(-limit, Math.min(limit, value));
}

type BaseProps = {
  variant?: Variant;
  size?: Size;
  trailingIcon?: ReactNode;
  iconNudge?: IconNudge;
  loading?: boolean;
  /** Magnetic pull; on by default, and always off on touch and reduced motion. */
  magnetic?: boolean;
  /** Opens in a new tab (links only). */
  external?: boolean;
};

// Motion owns the drag and animation event props, so the DOM versions are left
// out of what a Button accepts.
type DomOnly<T> = Omit<
  T,
  "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart"
>;

type ButtonAsButton = BaseProps &
  DomOnly<ComponentProps<"button">> & { href?: undefined };
type ButtonAsLink = BaseProps &
  DomOnly<ComponentProps<typeof Link>> & { href: string };

const MotionLink = motion.create(Link);

export function Button({
  variant = "primary",
  size = "md",
  trailingIcon,
  iconNudge = "right",
  loading = false,
  magnetic = true,
  external,
  className,
  children,
  ...rest
}: ButtonAsButton | ButtonAsLink) {
  const fine = useFinePointer();
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLElement | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const labelX = useTransform(x, (value) => (value * LABEL_PULL) / PULL);
  const labelY = useTransform(y, (value) => (value * LABEL_PULL) / PULL);

  const disabledProp = "disabled" in rest && Boolean(rest.disabled);
  const disabled = disabledProp || loading;
  const pulls = magnetic && fine && !reduced && !disabled;

  useEffect(() => {
    if (!pulls) return;
    let pulled = false;

    const release = () => {
      if (!pulled) return;
      pulled = false;
      animate(x, 0, SPRING);
      animate(y, 0, SPRING);
    };

    const onMove = (event: PointerEvent) => {
      const element = ref.current;
      if (!element) return;
      // Measure where the button rests, not where the pull has put it.
      const box = element.getBoundingClientRect();
      const left = box.left - x.get();
      const top = box.top - y.get();
      const near =
        event.clientX >= left - MARGIN &&
        event.clientX <= left + box.width + MARGIN &&
        event.clientY >= top - MARGIN &&
        event.clientY <= top + box.height + MARGIN;

      if (!near) {
        release();
        return;
      }
      pulled = true;
      const centreX = left + box.width / 2;
      const centreY = top + box.height / 2;
      animate(
        x,
        clamp((event.clientX - centreX) * PULL, MAX_OFFSET),
        PULL_SPRING,
      );
      animate(
        y,
        clamp((event.clientY - centreY) * PULL, MAX_OFFSET),
        PULL_SPRING,
      );
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", release);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", release);
      x.set(0);
      y.set(0);
    };
  }, [pulls, x, y]);

  const classes = cn(base, variants[variant], sizes[size], className);
  const state = {
    "data-disabled": disabled ? "" : undefined,
    "aria-busy": loading || undefined,
  };
  const motionProps = {
    style: { x, y },
    whileTap: disabled
      ? undefined
      : { scale: 0.97, transition: { duration: 0.12, ease: EASE_OUT } },
    transition: SPRING,
  };

  const inner = (
    <>
      <motion.span
        style={pulls ? { x: labelX, y: labelY } : undefined}
        className="inline-flex items-center gap-[inherit]"
      >
        {children}
      </motion.span>
      {loading ? (
        <LoaderCircle className="animate-spin" aria-hidden="true" />
      ) : (
        trailingIcon && (
          <span
            className={cn(
              "inline-flex transition-[translate] duration-150 ease-out motion-reduce:group-hover:translate-none",
              nudges[iconNudge],
            )}
            aria-hidden="true"
          >
            {trailingIcon}
          </span>
        )
      )}
    </>
  );

  if (typeof rest.href === "string") {
    const { onClick, ...linkRest } = rest as DomOnly<
      ComponentProps<typeof Link>
    >;
    const newTab = external
      ? { target: "_blank", rel: "noopener noreferrer" }
      : {};
    return (
      <MotionLink
        {...linkRest}
        {...newTab}
        {...state}
        {...motionProps}
        ref={ref as React.Ref<HTMLAnchorElement>}
        aria-disabled={disabled || undefined}
        tabIndex={disabled ? -1 : linkRest.tabIndex}
        onClick={(event: MouseEvent<HTMLAnchorElement>) => {
          if (disabled) {
            event.preventDefault();
            return;
          }
          onClick?.(event);
        }}
        className={classes}
      >
        {inner}
        {external && <span className="sr-only"> (opens in a new tab)</span>}
      </MotionLink>
    );
  }

  const { onClick, ...buttonRest } = rest as DomOnly<ComponentProps<"button">>;
  return (
    <motion.button
      type="button"
      {...buttonRest}
      {...state}
      {...motionProps}
      ref={ref as React.Ref<HTMLButtonElement>}
      disabled={disabledProp}
      onClick={(event) => {
        if (loading) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
      }}
      className={classes}
    >
      {inner}
    </motion.button>
  );
}
