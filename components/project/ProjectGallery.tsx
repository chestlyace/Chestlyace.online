"use client";

import { useRef, useState } from "react";
import { useReveal } from "@/components/blog/blocks/useReveal";
import { useMasonry } from "@/components/creatives/useMasonry";
import { placeholderUrl, responsiveImage } from "@/lib/cloudinary";
import { imageSource } from "@/lib/hero";
import { galleryRatio, type GalleryImage } from "@/lib/projectPage";

const WIDTHS = [480, 800, 1200, 1600];
const SIZES = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw";
// What a picture with no known size is laid out as until it has loaded.
const UNKNOWN = { width: 4, height: 3 };

type Tile = GalleryImage & { alt: string };

function GalleryTile({
  tile,
  size,
  index,
  span,
  onSize,
}: {
  tile: Tile;
  size: { width: number; height: number };
  index: number;
  span: number | null;
  onSize: (url: string, size: { width: number; height: number }) => void;
}) {
  const root = useRef<HTMLLIElement>(null);
  useReveal(root);
  const source = imageSource(tile.url);
  if (source.kind === "none") return null;
  const image = responsiveImage(source.src, WIDTHS);
  const placeholder = placeholderUrl(source.src);
  return (
    <li
      ref={root}
      style={span ? { gridRowEnd: `span ${span}` } : undefined}
      className="pb-3 transition-[opacity,translate] duration-700 ease-out data-[phase=armed]:translate-y-6 data-[phase=armed]:opacity-0"
    >
      <div
        style={{
          aspectRatio: String(galleryRatio(size.width, size.height)),
          backgroundImage: placeholder ? `url(${placeholder})` : undefined,
          backgroundSize: "cover",
        }}
        className="relative overflow-hidden rounded-lg bg-tile"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- Cloudinary, sized by srcset */}
        <img
          src={image.src}
          srcSet={image.srcSet}
          sizes={SIZES}
          width={tile.width ?? undefined}
          height={tile.height ?? undefined}
          alt={tile.alt}
          loading={index < 2 ? "eager" : "lazy"}
          decoding="async"
          onLoad={(event) => {
            // A picture saved before sizes were kept: lay it out by its own size now.
            const { naturalWidth, naturalHeight } = event.currentTarget;
            if (!tile.width && naturalWidth && naturalHeight)
              onSize(tile.url, { width: naturalWidth, height: naturalHeight });
          }}
          className="absolute inset-0 size-full object-cover"
        />
      </div>
    </li>
  );
}

// A project's gallery (design.md §14.10): a masonry, the pictures at their own
// proportions in columns, each placed in the shortest column so they read left to right
// and the columns end level (the arithmetic of §13.51, shared with the Creatives site).
// The sizes come with the page, so the layout is final before any picture loads.
export function ProjectGallery({
  images,
  label,
}: {
  images: readonly Tile[];
  label: string;
}) {
  const [loaded, setLoaded] = useState<
    Record<string, { width: number; height: number }>
  >({});
  const sizes = images.map((image) =>
    image.width && image.height
      ? { width: image.width, height: image.height }
      : (loaded[image.url] ?? UNKNOWN),
  );
  const { grid, spans, ready, style } = useMasonry(sizes, galleryRatio);
  if (images.length === 0) return null;

  return (
    <div ref={grid} className="mt-16 md:mt-24">
      <ul
        aria-label={label}
        style={style}
        className={
          ready
            ? "grid grid-flow-dense items-start"
            : "grid grid-cols-1 items-start gap-x-3 sm:grid-cols-2 lg:grid-cols-3"
        }
      >
        {images.map((image, index) => (
          <GalleryTile
            key={image.url}
            tile={image}
            size={sizes[index]}
            index={index}
            span={spans[index]}
            onSize={(url, size) =>
              setLoaded((current) => ({ ...current, [url]: size }))
            }
          />
        ))}
      </ul>
    </div>
  );
}
