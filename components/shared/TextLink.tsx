import { ArrowDown, ArrowRight, ArrowUp, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import type { ComponentProps, CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { RollText } from "./RollText";

type IconName = "up-right" | "up" | "right" | "down";

const ICONS = {
  "up-right": ArrowUpRight,
  up: ArrowUp,
  right: ArrowRight,
  down: ArrowDown,
} as const;

// Each arrow nudges 2px in the direction it points.
const NUDGE: Record<IconName, [string, string]> = {
  "up-right": ["2px", "-2px"],
  up: ["0px", "-2px"],
  right: ["2px", "0px"],
  down: ["0px", "2px"],
};

// Where a roll link sits decides its type and colours (design.md §13.3).
const TONES = {
  nav: "text-sm font-medium uppercase tracking-[0.04em] text-muted hover:text-foreground focus-visible:text-foreground",
  menu: "font-display text-display-lg uppercase text-foreground",
  footer:
    "text-[0.9375rem] text-muted hover:text-foreground focus-visible:text-foreground",
  standalone:
    "text-body font-medium text-foreground hover:text-primary-text focus-visible:text-primary-text",
} as const;

export type TextLinkTone = keyof typeof TONES;

type TextLinkProps = {
  href: string;
  className?: string;
  /** Opens in a new tab; adds the `↗` and a screen-reader hint. */
  external?: boolean;
  /** Extra screen-reader text, e.g. "opens the Creatives site". */
  srHint?: string;
} & (
  | {
      /** Text roll: nav, footer, and standalone links. */
      variant?: "roll";
      tone?: TextLinkTone;
      icon?: IconName;
      children: string;
    }
  | {
      /** Links inside running text: faint underline that draws in. */
      variant: "inline";
      tone?: never;
      icon?: never;
      children: ReactNode;
    }
) &
  Omit<ComponentProps<"a">, "href" | "children" | "className">;

function isInternalPath(href: string): boolean {
  return href.startsWith("/") && !href.startsWith("//");
}

export function TextLink({
  href,
  className,
  external,
  srHint,
  variant = "roll",
  tone = "standalone",
  icon,
  children,
  ...anchorProps
}: TextLinkProps) {
  const hint = [external ? "opens in a new tab" : null, srHint]
    .filter(Boolean)
    .join(", ");
  const hintNode = hint ? <span className="sr-only"> ({hint})</span> : null;
  const newTab = external
    ? { target: "_blank", rel: "noopener noreferrer" }
    : {};

  let content: ReactNode;
  let classes: string;

  if (variant === "inline") {
    classes = cn("link-inline rounded-sm", className);
    content = (
      <>
        {children}
        {external && (
          <ArrowUpRight
            className="ml-0.5 inline size-[0.85em] align-baseline"
            aria-hidden="true"
          />
        )}
        {hintNode}
      </>
    );
  } else {
    const iconName = icon ?? (external ? "up-right" : undefined);
    const Icon = iconName ? ICONS[iconName] : null;
    const [nudgeX, nudgeY] = iconName ? NUDGE[iconName] : ["0px", "0px"];
    classes = cn(
      "roll-host inline-flex items-center gap-1 rounded-sm transition-colors duration-150",
      TONES[tone],
      className,
    );
    content = (
      <>
        <RollText>{children as string}</RollText>
        {Icon && (
          <span
            className="roll-icon"
            style={
              { "--nudge-x": nudgeX, "--nudge-y": nudgeY } as CSSProperties
            }
            aria-hidden="true"
          >
            <Icon className="size-[0.9em]" />
          </span>
        )}
        {hintNode}
      </>
    );
  }

  if (isInternalPath(href)) {
    return (
      <Link href={href} className={classes} {...newTab} {...anchorProps}>
        {content}
      </Link>
    );
  }

  return (
    <a href={href} className={classes} {...newTab} {...anchorProps}>
      {content}
    </a>
  );
}
