import { format } from "@/lib/i18n/format";

// How a post's numbers and dates read in the mono labels (design.md §13.28).

/** `2026-10-20T09:00:00Z` → `2026-10-20`. */
export const isoDate = (timestamp: string) => timestamp.slice(0, 10);

/** `minRead` is the language's template, e.g. "{minutes} MIN READ". */
export const readingLabel = (minutes: number, minRead: string) =>
  format(minRead, { minutes });

/** The post's meta line: date, reading time, and when it was last changed. */
export function metaParts(
  post: { publishedAt: string; updatedAt: string; readingMinutes: number },
  minRead: string,
) {
  const published = isoDate(post.publishedAt);
  const updated = isoDate(post.updatedAt);
  return {
    published,
    updated: updated > published ? updated : null,
    reading: readingLabel(post.readingMinutes, minRead),
  };
}
