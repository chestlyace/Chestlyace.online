"use client";

import gsap from "gsap";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { RollText } from "@/components/shared/RollText";
import { placeholderUrl, resizedUrl } from "@/lib/cloudinary";
import type { PublicImage } from "@/lib/creatives/data";
import { prefersReducedMotionNow } from "@/lib/media";
import {
  rippleEnter,
  rippleLeave,
  rippleMove,
} from "@/components/main/projectRipple";

const LABEL = 76; // the cursor label's diameter, px

// One entrance of the creatives home (design.md §13.59): a tall panel with the latest
// featured image, a mono index, the section's name in Bebas, one line and "View the
// work". Hovering (fine pointer): the image ripples under the pointer (the main site's
// project ripple), the name's letters roll up and a round "VIEW" label follows the
// pointer. Touch, reduced motion and Save-Data: the plain image and a plain link.
export function SectionPortal({
  index,
  name,
  text,
  href,
  image,
}: {
  index: string;
  name: string;
  text: string;
  href: string;
  image: PublicImage | null;
}) {
  const panel = useRef<HTMLAnchorElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const move = useRef<{
    x: (v: number) => void;
    y: (v: number) => void;
  } | null>(null);
  const src = image ? resizedUrl(image.url, 1200) : null;
  const placeholder = image ? placeholderUrl(image.url) : null;

  useEffect(() => {
    const element = label.current;
    if (!element) return;
    move.current = {
      x: gsap.quickTo(element, "x", { duration: 0.3, ease: "power3.out" }),
      y: gsap.quickTo(element, "y", { duration: 0.3, ease: "power3.out" }),
    };
  }, []);

  const interactive = () => {
    const connection = (
      navigator as Navigator & {
        connection?: { saveData?: boolean };
      }
    ).connection;
    return !prefersReducedMotionNow() && !connection?.saveData;
  };

  const place = (clientX: number, clientY: number) => {
    const rect = panel.current?.getBoundingClientRect();
    if (!rect) return;
    move.current?.x(clientX - rect.left - LABEL / 2);
    move.current?.y(clientY - rect.top - LABEL / 2);
  };

  return (
    <Link
      ref={panel}
      href={href}
      aria-label={name}
      onPointerEnter={(event) => {
        if (event.pointerType !== "mouse" || !interactive()) return;
        place(event.clientX, event.clientY);
        gsap.to(label.current, { opacity: 1, scale: 1, duration: 0.2 });
        if (host.current && src) void rippleEnter(host.current, src);
      }}
      onPointerMove={(event) => {
        if (event.pointerType !== "mouse" || !interactive()) return;
        place(event.clientX, event.clientY);
        if (host.current)
          rippleMove(host.current, event.clientX, event.clientY);
      }}
      onPointerLeave={(event) => {
        if (event.pointerType !== "mouse") return;
        gsap.to(label.current, { opacity: 0, scale: 0.5, duration: 0.2 });
        rippleLeave();
      }}
      className="roll-host group relative block aspect-[4/5] overflow-hidden bg-tile outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring active:scale-[0.99] md:aspect-[3/4] [transition:scale_120ms_ease-out] [@media(hover:hover)_and_(pointer:fine)]:hover:cursor-none"
    >
      <div
        ref={host}
        style={{
          backgroundImage: placeholder ? `url(${placeholder})` : undefined,
          backgroundSize: "cover",
        }}
        className="absolute inset-0"
      >
        {src && (
          // eslint-disable-next-line @next/next/no-img-element -- Cloudinary, sized by the URL
          <img
            src={src}
            alt=""
            crossOrigin="anonymous"
            loading="lazy"
            decoding="async"
            className="absolute inset-0 size-full object-cover"
          />
        )}
      </div>
      <span
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-[60%] bg-linear-to-t from-black/70 to-transparent"
      />
      <span className="absolute inset-x-0 bottom-0 grid gap-3 p-6 text-[#f5f5f7] md:p-8">
        <span className="type-label text-[#d1d1d6]">{index}</span>
        <span className="font-display text-display-lg leading-[0.95] uppercase">
          <RollText>{name}</RollText>
        </span>
        <span className="max-w-[32ch] text-lead text-[#f5f5f7]">{text}</span>
        <span className="type-label inline-flex items-center gap-1 text-[#fb923c]">
          View the work
          <ArrowUpRight className="size-3.5" aria-hidden="true" />
        </span>
      </span>
      <span
        ref={label}
        aria-hidden="true"
        style={{ width: LABEL, height: LABEL, opacity: 0 }}
        className="type-label pointer-events-none absolute top-0 left-0 z-10 hidden scale-50 place-items-center rounded-full bg-primary text-primary-foreground [@media(hover:hover)_and_(pointer:fine)]:grid"
      >
        View
      </span>
    </Link>
  );
}
