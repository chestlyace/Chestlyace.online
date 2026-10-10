import { LOCALES, type Lang } from "@/lib/i18n";

// "3 days ago" for a comment's time (design.md §13.37), with the full date kept for
// the `title`. Pure, and takes `now` so it can be tested.
const UNITS: [
  limit: number,
  unit: Intl.RelativeTimeFormatUnit,
  size: number,
][] = [
  [60, "second", 1],
  [3600, "minute", 60],
  [86_400, "hour", 3600],
  [86_400 * 30, "day", 86_400],
  [86_400 * 365, "month", 86_400 * 30],
  [Infinity, "year", 86_400 * 365],
];

export function relativeTime(
  iso: string,
  now: number = Date.now(),
  lang: Lang = "en",
  justNow = "just now",
): string {
  const seconds = Math.round((Date.parse(iso) - now) / 1000);
  if (Number.isNaN(seconds)) return "";
  const distance = Math.abs(seconds);
  if (distance < 45) return justNow;
  const [, unit, size] = UNITS.find(([limit]) => distance < limit)!;
  return new Intl.RelativeTimeFormat(LOCALES[lang], { numeric: "auto" }).format(
    Math.round(seconds / size),
    unit,
  );
}

export const fullDate = (iso: string, lang: Lang = "en") =>
  new Date(iso).toLocaleString(LOCALES[lang], {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "UTC",
  }) + " UTC";
