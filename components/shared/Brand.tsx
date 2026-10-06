import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";

// The DA logo is a black circle whose lettering is transparent. In dark mode a
// light backing keeps the letters readable and shows as a thin outline.
export function Brand({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn("inline-flex items-center gap-3 rounded-md", className)}
    >
      <Image
        src="/brand/logo.png"
        alt=""
        width={40}
        height={40}
        priority
        className="size-10 rounded-full dark:bg-foreground"
      />
      <span className="font-display text-2xl leading-none tracking-wide text-foreground">
        Chestly Ace
      </span>
    </Link>
  );
}
