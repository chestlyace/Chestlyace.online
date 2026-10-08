"use client";

import { ArrowUpRight } from "lucide-react";
import { useRef } from "react";
import { placeholderUrl, responsiveImage } from "@/lib/cloudinary";
import { tileRatio } from "@/lib/creatives/gallery";
import type { PublicPiece } from "@/lib/creatives/data";
import { cn } from "@/lib/cn";
import { useReveal } from "@/components/blog/blocks/useReveal";

const WIDTHS = [480, 800, 1200, 1600];
const SIZES =
  "(min-width: 1536px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw";

// One design piece in the masonry (design.md §13.52): the image at its own ratio,
// a bottom gradient carrying the title and category, the year top-right. Hovering
// (or focusing) blurs and dims the image and slides the details up: the client, the
// tools and "View". Touch has no hover; a tap opens the lightbox. The entrance and
// Flip use `data-flip-id`, so a filter can glide the tiles that stay.
export function GalleryTile({
  piece,
  span,
  priority,
  onOpen,
}: {
  piece: PublicPiece;
  /** The rows the tile spans in the masonry (set once the grid is measured). */
  span: number | null;
  priority: boolean;
  onOpen: (slug: string, from: DOMRect) => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  useReveal(root);
  const ratio = tileRatio(piece.cover.width, piece.cover.height);
  const image = responsiveImage(piece.cover.url, WIDTHS);
  const placeholder = placeholderUrl(piece.cover.url);
  const tools = piece.tools.slice(0, 3);

  return (
    <div
      ref={root}
      data-flip-id={piece.slug}
      role="listitem"
      style={span ? { gridRowEnd: `span ${span}` } : undefined}
      className="pb-3 transition-[opacity,translate] duration-700 ease-out data-[phase=armed]:translate-y-6 data-[phase=armed]:opacity-0"
    >
      <button
        type="button"
        aria-label={`${piece.title}, ${piece.category}${piece.year ? `, ${piece.year}` : ""}`}
        onClick={(event) =>
          onOpen(piece.slug, event.currentTarget.getBoundingClientRect())
        }
        style={{
          aspectRatio: String(ratio),
          backgroundImage: placeholder ? `url(${placeholder})` : undefined,
          backgroundSize: "cover",
        }}
        className="group relative block w-full cursor-pointer overflow-hidden bg-tile text-left outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring active:scale-[0.985] [transition:scale_120ms_ease-out]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- Cloudinary, sized by srcset */}
        <img
          src={image.src}
          srcSet={image.srcSet}
          sizes={SIZES}
          width={piece.cover.width}
          height={piece.cover.height}
          alt=""
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
          className="absolute inset-0 size-full object-cover"
        />
        {/* The hover copy: blurred and dimmed, faded in over the sharp image. */}
        {/* eslint-disable-next-line @next/next/no-img-element -- the same image, blurred */}
        <img
          src={image.src}
          srcSet={image.srcSet}
          sizes={SIZES}
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          className="absolute inset-0 size-full scale-100 object-cover opacity-0 blur-[8px] transition-[opacity,scale] duration-300 ease-out group-focus-visible:scale-[1.03] group-focus-visible:opacity-100 motion-reduce:blur-none motion-reduce:transition-opacity [@media(hover:hover)]:group-hover:scale-[1.03] [@media(hover:hover)]:group-hover:opacity-100"
        />
        <span
          aria-hidden="true"
          className="absolute inset-0 bg-black/0 transition-colors duration-300 ease-out group-focus-visible:bg-black/45 [@media(hover:hover)]:group-hover:bg-black/45"
        />
        <span
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-[45%] bg-linear-to-t from-black/60 to-transparent"
        />
        <span
          aria-hidden="true"
          className="type-label absolute top-4 right-4 text-[#f5f5f7]"
        >
          {piece.year}
        </span>
        <span
          aria-hidden="true"
          className={cn(
            "absolute inset-x-0 bottom-0 grid gap-1 p-5 text-[#f5f5f7] transition-transform duration-300 ease-out",
            "translate-y-[6rem] group-focus-visible:translate-y-0 [@media(hover:hover)]:group-hover:translate-y-0",
            "max-[1023px]:translate-y-0 motion-reduce:transition-none",
          )}
        >
          <span className="text-h3 leading-tight">{piece.title}</span>
          <span className="type-label text-[#d1d1d6]">{piece.category}</span>
          <span className="mt-2 grid h-[5.5rem] content-start gap-2 opacity-0 transition-opacity duration-300 ease-out group-focus-visible:opacity-100 motion-reduce:transition-none max-[1023px]:hidden [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:none)]:hidden">
            {piece.client && (
              <span className="text-sm text-[#d1d1d6]">{piece.client}</span>
            )}
            <span className="flex flex-wrap items-center gap-1.5">
              {tools.map((tool) => (
                <span
                  key={tool}
                  className="type-label inline-flex h-6 items-center rounded-sm bg-white/15 px-2.5 whitespace-nowrap text-[#f5f5f7]"
                >
                  {tool}
                </span>
              ))}
            </span>
            <span className="type-label inline-flex items-center gap-1 text-[#fb923c]">
              View
              <ArrowUpRight className="size-3.5" />
            </span>
          </span>
        </span>
      </button>
    </div>
  );
}
