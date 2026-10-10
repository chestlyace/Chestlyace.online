"use client";

import Image from "next/image";
import { LOADING } from "@/lib/i18n/ui";
import { cn } from "@/lib/cn";
import { useLang } from "./LangProvider";

type Size = "lg" | "md" | "sm";

const NAME = "CHESTLY ACE";

// The brand loader (design.md §13.64, D91): the logo's ring draws itself and erases, the
// name's letters rise one by one, a line sweeps under them; one 2.4s loop, in the
// site's accent. `sm` is only the ring (inside buttons and next to labels). No spinner:
// the motion is drawing, and with reduced motion the ring and the name are simply shown.
// The animation is CSS (globals.css, `.loader-*`) so it runs before any script does.
export function BrandLoader({
  size = "lg",
  label,
  className,
  decorative = false,
}: {
  size?: Size;
  /** The status text; default "Loading" / "Chargement". */
  label?: string;
  className?: string;
  /** Inside something that already says it is busy (a button): no status of its own. */
  decorative?: boolean;
}) {
  const lang = useLang();
  const text = label ?? LOADING[lang];
  const ring = (
    <svg
      viewBox="0 0 100 100"
      aria-hidden="true"
      className={cn(
        "loader-ring-svg absolute inset-0 size-full -rotate-90",
        size === "sm" && "relative",
      )}
    >
      <circle
        cx="50"
        cy="50"
        r={size === "sm" ? 40 : 46}
        pathLength={1}
        fill="none"
        stroke="var(--primary)"
        strokeWidth={size === "sm" ? 12 : size === "md" ? 5 : 3.5}
        strokeLinecap="round"
        className="loader-ring"
      />
    </svg>
  );

  const body =
    size === "sm" ? (
      <span
        aria-hidden="true"
        className="relative inline-block size-4 align-middle"
      >
        {ring}
      </span>
    ) : (
      <span
        aria-hidden="true"
        className="grid justify-items-center gap-4 text-foreground"
      >
        <span
          className={cn(
            "relative grid place-items-center",
            size === "lg" ? "size-[7.5rem]" : "size-[3.75rem]",
          )}
        >
          {ring}
          <Image
            src="/brand/logo.png"
            alt=""
            width={size === "lg" ? 96 : 48}
            height={size === "lg" ? 96 : 48}
            priority
            className={cn(
              "loader-logo rounded-full dark:bg-foreground",
              size === "lg" ? "size-24" : "size-12",
            )}
          />
        </span>
        <span
          className={cn(
            "font-display flex overflow-hidden leading-none tracking-wide uppercase",
            size === "lg" ? "text-[2.5rem]" : "text-2xl",
          )}
        >
          {[...NAME].map((char, index) => (
            <span
              key={index}
              className="loader-letter inline-block whitespace-pre"
              style={{ animationDelay: `${index * 40}ms` }}
            >
              {char}
            </span>
          ))}
        </span>
        {size === "lg" && (
          <span className="loader-line block h-0.5 w-40 bg-primary" />
        )}
      </span>
    );

  if (decorative) return <span className={className}>{body}</span>;
  return (
    <span
      role="status"
      aria-live="polite"
      className={cn("inline-block", className)}
    >
      <span className="sr-only">{text}</span>
      {body}
    </span>
  );
}
