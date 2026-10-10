import type { PublicEvent, PublicImage, PublicPiece } from "./data";

// The featured work shown on the home page (design.md §14.20): the pieces and events
// marked featured in the admin, alternating (a piece, an event, …) so the mix shows
// early, up to `limit`. Pure.
export type FeaturedWork = {
  kind: "design" | "photography";
  slug: string;
  title: string;
  href: string;
  image: PublicImage;
};

export function featuredWork(
  pieces: readonly PublicPiece[],
  events: readonly PublicEvent[],
  limit = 8,
): FeaturedWork[] {
  const designs: FeaturedWork[] = pieces
    .filter((piece) => piece.isFeatured)
    .map((piece) => ({
      kind: "design",
      slug: piece.slug,
      title: piece.title,
      href: `/design?piece=${piece.slug}`,
      image: piece.cover,
    }));
  const photos: FeaturedWork[] = events
    .filter((event) => event.isFeatured)
    .map((event) => ({
      kind: "photography",
      slug: event.slug,
      title: event.title,
      href: `/photography/${event.slug}`,
      image: event.cover,
    }));
  const mixed: FeaturedWork[] = [];
  for (
    let i = 0;
    mixed.length < limit && (i < designs.length || i < photos.length);
    i++
  ) {
    if (i < designs.length) mixed.push(designs[i]);
    if (mixed.length < limit && i < photos.length) mixed.push(photos[i]);
  }
  return mixed;
}

// The hero line's statement split at the "&", so it sets in two lines: "DESIGN" and
// "& PHOTOGRAPHY". A statement without one stays a single line.
export function statementLines(statement: string): string[] {
  const text = statement.trim().replace(/\s+/g, " ");
  const at = text.indexOf("&");
  if (at <= 0) return [text];
  return [text.slice(0, at).trim(), text.slice(at).trim()];
}
