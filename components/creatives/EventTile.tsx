"use client";

import { ArrowUpRight } from "lucide-react";
import { Link } from "@/components/shared/Link";
import { useRef } from "react";
import { useReveal } from "@/components/blog/blocks/useReveal";
import { cn } from "@/lib/cn";
import { placeholderUrl, responsiveImage } from "@/lib/cloudinary";
import type { PublicEvent } from "@/lib/creatives/data";
import { eventYear, formatEventDate } from "@/lib/creatives/events";
import { rememberTile } from "./eventFlight";

const WIDTHS = [640, 960, 1400, 2000];

// One photography event (design.md §13.54): a 16:10 cover with the year top-right and
// the title bottom-left, the place, date and number of pictures under it. Hovering
// (or focusing) blurs and dims the cover and rises a panel with the story, the role
// and "Open the event"; touch has no hover, a tap opens the page. Opening hands the
// cover's rectangle to the event page, whose hero grows from it.
export function EventTile({
  event,
  featured = false,
  priority = false,
  className,
}: {
  event: PublicEvent;
  featured?: boolean;
  priority?: boolean;
  className?: string;
}) {
  const root = useRef<HTMLDivElement>(null);
  useReveal(root);
  const image = responsiveImage(event.cover.url, WIDTHS);
  const placeholder = placeholderUrl(event.cover.url);
  const count = event.images.length;
  const meta = [event.place, formatEventDate(event.eventDate)]
    .filter(Boolean)
    .join(" · ");
  const sizes = featured
    ? "(min-width: 768px) 100vw, 100vw"
    : "(min-width: 768px) 50vw, 100vw";

  return (
    <div
      ref={root}
      className={cn(
        "transition-[opacity,translate] duration-700 ease-out data-[phase=armed]:translate-y-8 data-[phase=armed]:opacity-0",
        className,
      )}
    >
      <Link
        href={`/photography/${event.slug}`}
        aria-label={[event.title, event.place, formatEventDate(event.eventDate)]
          .filter(Boolean)
          .join(", ")}
        onClick={(click) => rememberTile(event.slug, click.currentTarget)}
        className="group block outline-none"
      >
        <span
          data-event-cover={event.slug}
          style={{
            backgroundImage: placeholder ? `url(${placeholder})` : undefined,
            backgroundSize: "cover",
          }}
          className={cn(
            "relative block w-full overflow-hidden bg-tile group-focus-visible:outline-2 group-focus-visible:-outline-offset-2 group-focus-visible:outline-ring [transition:scale_120ms_ease-out] group-active:scale-[0.99]",
            featured ? "aspect-[16/10] md:aspect-[21/9]" : "aspect-[16/10]",
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- Cloudinary, sized by srcset */}
          <img
            src={image.src}
            srcSet={image.srcSet}
            sizes={sizes}
            width={event.cover.width}
            height={event.cover.height}
            alt=""
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            decoding="async"
            className="absolute inset-0 size-full object-cover"
          />
          {/* The hover copy: the same cover, blurred, faded in over the sharp one. */}
          {/* eslint-disable-next-line @next/next/no-img-element -- the same image, blurred */}
          <img
            src={image.src}
            srcSet={image.srcSet}
            sizes={sizes}
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            className="absolute inset-0 size-full scale-100 object-cover opacity-0 blur-[10px] transition-[opacity,scale] duration-350 ease-out group-focus-visible:scale-[1.03] group-focus-visible:opacity-100 motion-reduce:blur-none motion-reduce:transition-opacity [@media(hover:hover)]:group-hover:scale-[1.03] [@media(hover:hover)]:group-hover:opacity-100"
          />
          <span
            aria-hidden="true"
            className="absolute inset-0 bg-black/0 transition-colors duration-350 ease-out group-focus-visible:bg-black/55 [@media(hover:hover)]:group-hover:bg-black/55"
          />
          <span
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-black/65 to-transparent"
          />
          <span
            aria-hidden="true"
            className="type-label absolute top-4 right-4 text-[#f5f5f7]"
          >
            {event.kind && (
              <span className="mr-3 text-[#d1d1d6]">{event.kind}</span>
            )}
            {eventYear(event)}
          </span>
          {/* The hover panel: story, role, the way in. Hidden on touch. */}
          <span
            aria-hidden="true"
            className="absolute inset-x-0 top-0 hidden translate-y-4 gap-3 p-6 text-[#f5f5f7] opacity-0 transition-[opacity,translate] duration-350 ease-out group-focus-visible:translate-y-0 group-focus-visible:opacity-100 motion-reduce:transition-opacity [@media(hover:hover)]:grid [@media(hover:hover)]:group-hover:translate-y-0 [@media(hover:hover)]:group-hover:opacity-100"
          >
            {event.description && (
              <span className="line-clamp-3 max-w-[56ch] text-sm leading-relaxed text-[#e5e5ea]">
                {event.description}
              </span>
            )}
            {event.role && (
              <span className="type-label text-[#d1d1d6]">{event.role}</span>
            )}
            <span className="type-label inline-flex items-center gap-1 text-[#fb923c]">
              Open the event
              <ArrowUpRight className="size-3.5" />
            </span>
          </span>
          <span
            aria-hidden="true"
            className={cn(
              "font-display absolute bottom-0 left-0 p-5 leading-[0.95] text-[#f5f5f7] uppercase md:p-6",
              featured
                ? "text-display-lg"
                : "text-[clamp(2.25rem,1.6rem+2vw,3.5rem)]",
            )}
          >
            {event.title}
          </span>
        </span>
        <span className="type-label mt-3 flex items-baseline justify-between gap-4 text-muted">
          <span>{meta}</span>
          {count > 0 && (
            <span className="whitespace-nowrap">
              {count} {count === 1 ? "PHOTO" : "PHOTOS"}
            </span>
          )}
        </span>
      </Link>
    </div>
  );
}
