"use client";

import { ArrowUpRight, Check, Copy } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { IconButton } from "@/components/shared/IconButton";
import { cn } from "@/lib/cn";
import { EASE_OUT } from "@/lib/motion";

const subscribeNothing = () => () => {};

// One way to reach Chestly (design.md §13.14): an Iconly icon, a label, the
// value, and `↗`. The whole tile is the link (a stretched pseudo-element); the
// copy button sits above it as its own button.
export function ContactTile({
  icon,
  label,
  value,
  href,
  external = false,
  copy,
  className,
  children,
}: {
  icon: ReactNode;
  /** "Email", "Phone", "WhatsApp". */
  label: string;
  value: string;
  href: string;
  external?: boolean;
  /** Adds the copy button: what is copied and what it is called. */
  copy?: {
    text: string;
    buttonLabel: string;
    announcement: string;
    /** The small "Copied" bubble. */
    copiedLabel: string;
  };
  className?: string;
  /** Extra controls in the bottom-right corner (the WhatsApp QR button). */
  children?: ReactNode;
}) {
  // The copy button is hidden where the clipboard isn't available. The server
  // render assumes it isn't, so the markup matches before hydration.
  const canCopy = useSyncExternalStore(
    subscribeNothing,
    () =>
      typeof navigator !== "undefined" &&
      Boolean(navigator.clipboard?.writeText),
    () => false,
  );
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const onCopy = async () => {
    if (!copy) return;
    try {
      await navigator.clipboard.writeText(copy.text);
    } catch {
      return; // permission denied: leave the button as it was
    }
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        "group relative flex min-h-0 flex-col rounded-lg bg-tile p-5 transition-[background-color,scale] duration-150 ease-out active:scale-[0.98] has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-ring motion-reduce:active:scale-100 md:min-h-44 md:p-6 [@media(hover:hover)]:hover:bg-tile-hover",
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <span className="text-foreground" aria-hidden="true">
          {icon}
        </span>
        <ArrowUpRight
          className="size-5 text-muted transition-[translate,color] duration-150 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground motion-reduce:group-hover:translate-none"
          aria-hidden="true"
        />
      </div>

      <p className="type-label mt-6 text-muted" aria-hidden="true">
        {label}
      </p>
      <p className="mt-1.5 pr-12 text-[1.0625rem] font-medium [overflow-wrap:anywhere] text-foreground">
        <a
          href={href}
          {...(external
            ? { target: "_blank", rel: "noopener noreferrer" }
            : {})}
          aria-label={`${label}: ${value}`}
          className="after:absolute after:inset-0 after:rounded-lg after:content-[''] focus-visible:outline-none"
        >
          {value}
        </a>
      </p>

      <div className="absolute right-3 bottom-3 z-10 flex items-center gap-1 md:right-4 md:bottom-4">
        {children}
        {copy && canCopy && (
          <span className="relative">
            <IconButton
              label={copy.buttonLabel}
              iconKey={copied ? "check" : "copy"}
              onClick={onCopy}
              className={cn("size-9", copied && "text-secondary")}
            >
              {copied ? (
                <Check className="size-[1.125rem]" />
              ) : (
                <Copy className="size-[1.125rem]" />
              )}
            </IconButton>
            <AnimatePresence>
              {copied && (
                <motion.span
                  aria-hidden="true"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15, ease: EASE_OUT }}
                  style={{ transformOrigin: "bottom right" }}
                  className="type-label pointer-events-none absolute right-0 bottom-[calc(100%+4px)] rounded-sm bg-surface-raised px-2 py-1 whitespace-nowrap text-foreground shadow-float"
                >
                  {copy.copiedLabel}
                </motion.span>
              )}
            </AnimatePresence>
          </span>
        )}
      </div>
      <span role="status" aria-live="polite" className="sr-only">
        {copied && copy ? copy.announcement : ""}
      </span>
    </div>
  );
}
