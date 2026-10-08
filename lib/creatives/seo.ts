import { PERSON_NAME, siteOrigin } from "@/lib/seo";
import type { PublicEvent, PublicPiece } from "./data";

// Structured data for the creatives pages (design.md §14.21): the gallery as a
// CollectionPage whose pieces are CreativeWorks with their image.
export function designJsonLd(
  pieces: readonly PublicPiece[],
  origin: string = siteOrigin("creatives"),
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Graphic design",
    url: `${origin}/design`,
    isPartOf: {
      "@type": "WebSite",
      name: `${PERSON_NAME} — Design & Photography`,
      url: origin,
    },
    hasPart: pieces.map((piece) => ({
      "@type": "CreativeWork",
      name: piece.title,
      genre: piece.category,
      image: piece.cover.url,
      ...(piece.description ? { description: piece.description } : {}),
      ...(piece.client
        ? { sponsor: { "@type": "Organization", name: piece.client } }
        : {}),
      ...(piece.year ? { dateCreated: String(piece.year) } : {}),
      creator: { "@type": "Person", name: PERSON_NAME },
    })),
  };
}

// The Photography page (design.md §14.22): a collection of events.
export function photographyJsonLd(
  events: readonly PublicEvent[],
  origin: string = siteOrigin("creatives"),
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Photography",
    url: `${origin}/photography`,
    isPartOf: {
      "@type": "WebSite",
      name: `${PERSON_NAME} — Design & Photography`,
      url: origin,
    },
    hasPart: events.map((event) => ({
      "@type": "Event",
      name: event.title,
      startDate: event.eventDate,
      url: `${origin}/photography/${event.slug}`,
      image: event.cover.url,
      ...(event.place
        ? { location: { "@type": "Place", name: event.place } }
        : {}),
    })),
  };
}

// One event page (design.md §14.23): an ImageGallery of its pictures, about the event.
export function eventJsonLd(
  event: PublicEvent,
  origin: string = siteOrigin("creatives"),
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "ImageGallery",
    name: event.title,
    url: `${origin}/photography/${event.slug}`,
    ...(event.description ? { description: event.description } : {}),
    dateCreated: event.eventDate,
    ...(event.place
      ? { contentLocation: { "@type": "Place", name: event.place } }
      : {}),
    creator: { "@type": "Person", name: PERSON_NAME },
    primaryImageOfPage: { "@type": "ImageObject", contentUrl: event.cover.url },
    image: [event.cover, ...event.images].map((image) => ({
      "@type": "ImageObject",
      contentUrl: image.url,
      ...(image.alt ? { description: image.alt } : {}),
    })),
    about: {
      "@type": "Event",
      name: event.title,
      startDate: event.eventDate,
      ...(event.place
        ? { location: { "@type": "Place", name: event.place } }
        : {}),
    },
  };
}
