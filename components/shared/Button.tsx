"use client";

import { LoaderCircle } from "lucide-react";
import {
  animate,
  motion,
  useMotionTemplate,
  useMotionValue,
  useTransform,
} from "motion/react";
import Link from "next/link";
import {
  useEffect,
  useRef,
  type ComponentProps,
  type MouseEvent,
  type ReactNode,
} from "react";
import { cn } from "@/lib/cn";
import { isPagePath } from "@/lib/links";
import { useFinePointer, usePrefersReducedMotion } from "@/lib/media";
import { EASE_OUT, SPRING } from "@/lib/motion";

type Variant = "primary" | "secondary" | "ghost" | "destructive";
type Size = "sm" | "md" | "lg";
type IconNudge = "right" | "up-right" | "down" | "none";

// Pill-shaped buttons (design.md §13.1).
const base =
  "group relative inline-flex select-none items-center justify-center gap-2 rounded-full font-medium tracking-[-0.005em] whitespace-nowrap transition-colors duration-150 data-disabled:cursor-not-allowed data-disabled:opacity-40";

// `--sheen` is the colour of the light that follows the pointer (see Button).
const variants: Record<Variant, string> = {
  primary:
    "bg-primary text-primary-foreground [--sheen:rgb(255_255_255/0.3)] not-data-disabled:hover:bg-primary-hover",
  secondary:
    "border border-border bg-tile text-foreground [--sheen:color-mix(in_srgb,var(--foreground)_12%,transparent)] not-data-disabled:hover:border-muted/40 not-data-disabled:hover:bg-tile-hover",
  // Admin only (design.md §13.23): deleting.
  destructive:
    "bg-danger text-white [--sheen:rgb(255_255_255/0.25)] not-data-disabled:hover:bg-danger/85",
  ghost:
    "text-foreground [--sheen:color-mix(in_srgb,var(--foreground)_10%,transparent)] not-data-disabled:hover:bg-tile",
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

// Magnetic pull (design.md §13.1): within 100px of the button, it leans toward
// the pointer by 30% of the offset, at most 40px, and stretches a little along
// the pull; the label travels 1.6× as far, so it floats above the pill. A light
// sheen follows the pointer across the face. A springy return (a small
// overshoot) brings everything back when the pointer leaves.
const MARGIN = 100;
const PULL = 0.3;
const MAX_OFFSET = 40;
const LABEL_PULL = 0.18; // the label's extra share: 0.3 + 0.18 ≈ 1.6×
const STRETCH = 0.0025; // scale per px of pull along the axis…
const SQUASH = 0.001; // …and the loss across it
const PULL_SPRING = { type: "spring", bounce: 0, duration: 0.3 } as const;
const RETURN_SPRING = { type: "spring", bounce: 0.35, duration: 0.8 } as const;
const GLOW_SPRING = { type: "spring", bounce: 0, duration: 0.35 } as const;
const SHEEN_RADIUS = 150;

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
  // Stretch along the pull, squash across it.
  const scaleX = useTransform([x, y], ([dx, dy]: number[]) =>
    Math.max(0.9, 1 + Math.abs(dx) * STRETCH - Math.abs(dy) * SQUASH),
  );
  const scaleY = useTransform([x, y], ([dx, dy]: number[]) =>
    Math.max(0.9, 1 + Math.abs(dy) * STRETCH - Math.abs(dx) * SQUASH),
  );
  // The sheen: where the pointer is on the button, and how close it is.
  const sheenX = useMotionValue(0);
  const sheenY = useMotionValue(0);
  const glow = useMotionValue(0);
  const sheen = useMotionTemplate`radial-gradient(circle ${SHEEN_RADIUS}px at ${sheenX}px ${sheenY}px, var(--sheen), transparent 70%)`;

  const disabledProp = "disabled" in rest && Boolean(rest.disabled);
  const disabled = disabledProp || loading;
  const pulls = magnetic && fine && !reduced && !disabled;

  useEffect(() => {
    if (!pulls) return;
    let pulled = false;

    const release = () => {
      if (!pulled) return;
      pulled = false;
      animate(x, 0, RETURN_SPRING);
      animate(y, 0, RETURN_SPRING);
      animate(glow, 0, GLOW_SPRING);
    };

    const onMove = (event: PointerEvent) => {
      const element = ref.current;
      if (!element) return;
      // Measure where the button rests, not where the pull has put it.
      const box = element.getBoundingClientRect();
      const left = box.left - x.get();
      const top = box.top - y.get();
      // How far the pointer is outside the button's box (0 when over it).
      const gapX = Math.max(
        left - event.clientX,
        0,
        event.clientX - (left + box.width),
      );
      const gapY = Math.max(
        top - event.clientY,
        0,
        event.clientY - (top + box.height),
      );
      const gap = Math.hypot(gapX, gapY);

      if (gap > MARGIN) {
        release();
        return;
      }
      pulled = true;
      sheenX.set(event.clientX - left);
      sheenY.set(event.clientY - top);
      // 1 over the button, 0 at the edge of the zone: the sheen follows it,
      // and the pull eases in from 40% so it doesn't snap on at the edge.
      const closeness = 1 - gap / MARGIN;
      animate(glow, closeness, GLOW_SPRING);
      const strength = 0.4 + 0.6 * closeness;
      const centreX = left + box.width / 2;
      const centreY = top + box.height / 2;
      animate(
        x,
        clamp((event.clientX - centreX) * PULL * strength, MAX_OFFSET),
        PULL_SPRING,
      );
      animate(
        y,
        clamp((event.clientY - centreY) * PULL * strength, MAX_OFFSET),
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
  }, [pulls, x, y, glow, sheenX, sheenY]);

  const classes = cn(base, variants[variant], sizes[size], className);
  const state = {
    "data-disabled": disabled ? "" : undefined,
    "aria-busy": loading || undefined,
  };
  const motionProps = {
    style: { x, y, scaleX, scaleY },
    whileTap: disabled
      ? undefined
      : { scale: 0.97, transition: { duration: 0.12, ease: EASE_OUT } },
    transition: SPRING,
  };

  const inner = (
    <>
      {pulls && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]"
        >
          <motion.span
            style={{ opacity: glow, backgroundImage: sheen }}
            className="absolute inset-0"
          />
        </span>
      )}
      <motion.span
        style={pulls ? { x: labelX, y: labelY } : undefined}
        className="relative inline-flex items-center gap-[inherit]"
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
    const shared = {
      ...linkRest,
      ...newTab,
      ...state,
      ...motionProps,
      "aria-disabled": disabled || undefined,
      tabIndex: disabled ? -1 : linkRest.tabIndex,
      onClick: (event: MouseEvent<HTMLAnchorElement>) => {
        if (disabled) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
      },
      className: classes,
    };
    const hint = external && (
      <span className="sr-only"> (opens in a new tab)</span>
    );

    // Files (a resume PDF) and hash links are plain anchors: <Link> would try to
    // prefetch a file as if it were a page.
    if (!isPagePath(linkRest.href as string)) {
      return (
        <motion.a
          {...(shared as ComponentProps<typeof motion.a>)}
          ref={ref as React.Ref<HTMLAnchorElement>}
        >
          {inner}
          {hint}
        </motion.a>
      );
    }
    return (
      <MotionLink {...shared} ref={ref as React.Ref<HTMLAnchorElement>}>
        {inner}
        {hint}
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
