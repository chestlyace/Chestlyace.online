import Image from "next/image";
import { Link } from "./Link";
import { cn } from "@/lib/cn";

type BrandProps = {
  /** The link's accessible name ("Chestly Ace — home"), in the page's language. */
  homeLabel?: string;
  className?: string;
  /** `md` is the header's 32px logo; `lg` the footer's 40px. */
  size?: "md" | "lg";
  /** Hide the wordmark below `lg` (the header between 768 and 1023px). */
  wordmarkClassName?: string;
};

// The DA logo is a black circle whose lettering is transparent. In dark mode a
// light backing keeps the letters readable and shows as a thin outline.
export function Brand({
  homeLabel = "Chestly Ace — home",
  className,
  size = "md",
  wordmarkClassName,
}: BrandProps) {
  const logo = size === "md" ? 32 : 40;
  return (
    <Link
      href="/"
      aria-label={homeLabel}
      className={cn("inline-flex items-center gap-2 rounded-full", className)}
    >
      <Image
        src="/brand/logo.png"
        alt=""
        width={logo}
        height={logo}
        priority
        className={cn(
          "rounded-full dark:bg-foreground",
          size === "md" ? "size-8" : "size-10",
        )}
      />
      <span
        className={cn(
          "font-display leading-none tracking-wide text-foreground",
          size === "md" ? "text-xl" : "text-2xl",
          wordmarkClassName,
        )}
      >
        Chestly Ace
      </span>
    </Link>
  );
}
