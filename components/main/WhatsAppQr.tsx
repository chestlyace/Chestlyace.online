"use client";

import { QrCode } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useRef, useState } from "react";
import { EASE_OUT } from "@/lib/motion";

// "QR" on the WhatsApp tile (design.md §14.8): on a desktop it opens a small
// popover with the code to scan with a phone. Phones don't show it — they tap
// the link. The code arrives as ready-made path data (lib/qr.ts), so there is no
// QR code library in the browser.
export function WhatsAppQr({ size, d }: { size: number; d: string }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLSpanElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <span
      ref={rootRef}
      className="relative hidden [@media(hover:hover)]:inline-flex"
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((value) => !value)}
        className="type-label relative inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-foreground transition-colors duration-150 before:absolute before:-inset-1 before:content-[''] hover:bg-background/60"
      >
        <QrCode className="size-4" aria-hidden="true" />
        QR
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            id={id}
            role="group"
            aria-label="WhatsApp QR code"
            initial={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{
              opacity: 0,
              scale: 0.95,
              filter: "blur(4px)",
              transition: { duration: 0.15, ease: EASE_OUT },
            }}
            transition={{ duration: 0.2, ease: EASE_OUT }}
            style={{ transformOrigin: "bottom right" }}
            className="absolute right-0 bottom-[calc(100%+8px)] w-48 rounded-md border border-border/60 bg-surface-raised p-3 shadow-float-lifted"
          >
            {/* Always dark on white, whatever the theme: scanners need it. */}
            <svg
              viewBox={`-2 -2 ${size + 4} ${size + 4}`}
              role="img"
              aria-label="QR code that opens a WhatsApp chat"
              shapeRendering="crispEdges"
              className="w-full rounded-sm bg-white"
            >
              <path d={d} fill="#000" />
            </svg>
            <p className="type-label mt-2 text-center text-muted">
              Scan to connect
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}
