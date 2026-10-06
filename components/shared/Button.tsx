import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "link";
type Size = "sm" | "md" | "lg";

const base =
  "relative inline-flex items-center justify-center gap-2 font-medium transition-colors disabled:pointer-events-none disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary: "rounded-md bg-primary text-primary-foreground hover:bg-primary/90",
  secondary:
    "rounded-md border border-border bg-transparent text-foreground hover:bg-surface-raised",
  ghost: "rounded-md text-foreground hover:bg-surface-raised",
  link: "rounded-sm text-sm text-primary-text underline-offset-4 hover:underline",
};

// sm is visually 36px; the ::before extends the tap target to 44px (design.md §10).
const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-sm before:absolute before:inset-x-0 before:-inset-y-1",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
};

type BaseProps = {
  variant?: Variant;
  size?: Size;
  trailingIcon?: ReactNode;
};

type ButtonAsButton = BaseProps &
  ComponentProps<"button"> & { href?: undefined };
type ButtonAsLink = BaseProps & ComponentProps<typeof Link> & { href: string };

export function Button({
  variant = "primary",
  size = "md",
  trailingIcon,
  className,
  children,
  ...rest
}: ButtonAsButton | ButtonAsLink) {
  const classes = cn(
    base,
    variants[variant],
    variant !== "link" && sizes[size],
    className,
  );

  if (typeof rest.href === "string") {
    return (
      <Link {...(rest as ComponentProps<typeof Link>)} className={classes}>
        {children}
        {trailingIcon}
      </Link>
    );
  }

  return (
    <button
      type="button"
      {...(rest as ComponentProps<"button">)}
      className={classes}
    >
      {children}
      {trailingIcon}
    </button>
  );
}
