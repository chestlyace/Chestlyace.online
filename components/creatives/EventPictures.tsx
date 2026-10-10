"use client";

import { useRef, useState } from "react";
import { useReveal } from "@/components/blog/blocks/useReveal";
import { placeholderUrl, responsiveImage } from "@/lib/cloudinary";
import { tileRatio } from "@/lib/creatives/gallery";
import type { PublicEvent } from "@/lib/creatives/data";
import { PictureLightbox } from "./PictureLightbox";
import { useMasonry } from "./useMasonry";
import { useCreativesText } from "@/components/creatives/useCreativesText";
import { format } from "@/lib/i18n/format";

type Picture = PublicEvent["images"][number];

const WIDTHS = [480, 800, 1200, 1600];
const SIZES = "(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 100vw";

function PictureTile({
  picture,
  index,
  span,
  onOpen,
}: {
  picture: Picture;
  index: number;
  span: number | null;
  onOpen: (index: number, from: DOMRect) => void;
}) {
  const t = useCreativesText();
  const root = useRef<HTMLLIElement>(null);
  useReveal(root);
  const image = responsiveImage(picture.url, WIDTHS);
  const placeholder = placeholderUrl(picture.url);
  return (
    <li
      ref={root}
      data-picture={index}
      style={span ? { gridRowEnd: `span ${span}` } : undefined}
      className="pb-3 transition-[opacity,translate] duration-700 ease-out data-[phase=armed]:translate-y-6 data-[phase=armed]:opacity-0"
    >
      <button
        type="button"
        aria-label={`${format(t.openPicture, { n: index + 1 })}${picture.alt ? `: ${picture.alt}` : ""}`}
        onClick={(click) =>
          onOpen(index, click.currentTarget.getBoundingClientRect())
        }
        style={{
          aspectRatio: String(tileRatio(picture.width, picture.height)),
          backgroundImage: placeholder ? `url(${placeholder})` : undefined,
          backgroundSize: "cover",
        }}
        className="group relative block w-full cursor-zoom-in overflow-hidden bg-tile outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring active:scale-[0.985] [transition:scale_120ms_ease-out]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- Cloudinary, sized by srcset */}
        <img
          src={image.src}
          srcSet={image.srcSet}
          sizes={SIZES}
          width={picture.width}
          height={picture.height}
          alt=""
          loading={index < 2 ? "eager" : "lazy"}
          decoding="async"
          className="absolute inset-0 size-full object-cover transition-transform duration-500 ease-out motion-reduce:transition-none [@media(hover:hover)]:group-hover:scale-[1.03]"
        />
      </button>
    </li>
  );
}

// The event's selected pictures (design.md §14.23): the masonry of §13.51 without
// titles, and a lightbox through them with their captions.
export function EventPictures({ event }: { event: PublicEvent }) {
  const t = useCreativesText();
  const pictures = event.images;
  const { grid, spans, ready, style } = useMasonry(pictures);
  const [open, setOpen] = useState<number | null>(null);
  const [origin, setOrigin] = useState<DOMRect | null>(null);
  if (pictures.length === 0) return null;

  return (
    <>
      <div ref={grid}>
        <ul
          aria-label={format(t.picturesFrom, { title: event.title })}
          className={
            ready
              ? "grid grid-flow-dense items-start"
              : "grid grid-cols-1 items-start gap-x-3 sm:grid-cols-2 lg:grid-cols-3"
          }
          style={style}
        >
          {pictures.map((picture, index) => (
            <PictureTile
              key={picture.url}
              picture={picture}
              index={index}
              span={spans[index]}
              onOpen={(i, from) => {
                setOrigin(from);
                setOpen(i);
              }}
            />
          ))}
        </ul>
      </div>
      {open !== null && (
        <PictureLightbox
          title={event.title}
          pictures={pictures}
          index={open}
          origin={origin}
          onStep={(i) => {
            setOrigin(null);
            setOpen(i);
          }}
          onClose={() => {
            setOrigin(null);
            setOpen(null);
          }}
        />
      )}
    </>
  );
}
