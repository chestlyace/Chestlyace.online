import { PERSON_NAME, siteOrigin } from "@/lib/seo";
import type { PublicPiece } from "./data";

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
