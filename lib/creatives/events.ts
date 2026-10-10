import { LOCALES, type Lang } from "@/lib/i18n";
import type { PublicEvent } from "./data";

// Small helpers for the photography pages (design.md §14.22–14.23), apart from React.

// "2026-03-14" → "14 Mar 2026" in English, "14 mars 2026" in French (no time zone is
// involved: it is a calendar date).
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function formatEventDate(iso: string, lang: Lang = "en"): string {
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return iso;
  if (lang === "en") return `${day} ${MONTHS[month - 1]} ${year}`;
  return new Intl.DateTimeFormat(LOCALES[lang], {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

export function eventYear(event: Pick<PublicEvent, "eventDate">): string {
  return event.eventDate.slice(0, 4);
}

/** The service the album is on ("Google Photos"), when the admin names it. */
export function albumService(
  event: Pick<PublicEvent, "albumLabel">,
): string | null {
  return event.albumLabel?.trim() || null;
}

/** The event after this one, wrapping round; null when it is the only one. */
export function nextEvent(
  events: readonly PublicEvent[],
  slug: string,
): PublicEvent | null {
  const index = events.findIndex((event) => event.slug === slug);
  if (index < 0 || events.length < 2) return null;
  return events[(index + 1) % events.length];
}
