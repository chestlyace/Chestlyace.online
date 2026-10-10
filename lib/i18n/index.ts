// Languages (docs/i18n.md, D89): the list, the French switch, and the pure helpers
// that turn a path into the other language's. No React, no DOM.

export const LANGS = ["en", "fr"] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = "en";

export function isLang(value: unknown): value is Lang {
  return (
    typeof value === "string" && (LANGS as readonly string[]).includes(value)
  );
}

/**
 * Whether French is reachable in production. It stays `false` until the last build
 * step of Phase 11 (11b.6) switches it on, so no half-French site can be visited;
 * previews and development always reach it (docs/i18n.md §11).
 */
export const FRENCH_PUBLIC = false;

/** The Intl locale of each language: dates, numbers, plurals. */
export const LOCALES: Record<Lang, string> = { en: "en-GB", fr: "fr-FR" };

/** The Open Graph locale of each language. */
export const OG_LOCALES: Record<Lang, string> = { en: "en_US", fr: "fr_FR" };

/** The name of each language, in itself (the switcher shows these). */
export const LANG_NAMES: Record<Lang, string> = {
  en: "English",
  fr: "Français",
};

/**
 * Splits a public path into its language and the rest: `/fr/design` → fr, `/design`;
 * `/design` → null, `/design`. Only a whole first segment counts (`/frequently` is not
 * French). `/fr` alone is the French home, `/`.
 */
export function splitLang(pathname: string): {
  lang: Lang | null;
  rest: string;
} {
  const [, first = "", ...more] = pathname.split("/");
  if (isLang(first)) {
    const rest = more.length ? `/${more.join("/")}` : "/";
    return { lang: first, rest };
  }
  return { lang: null, rest: pathname || "/" };
}

/** The public address of `path` (which has no language in it) in `lang`. */
export function localizedPath(path: string, lang: Lang): string {
  const { rest } = splitLang(path);
  const clean = rest === "" ? "/" : rest;
  if (lang === DEFAULT_LANG) return clean;
  return clean === "/" ? `/${lang}` : `/${lang}${clean}`;
}

/** The same page in another language, from the current public path. */
export function switchPath(pathname: string, to: Lang): string {
  return localizedPath(splitLang(pathname).rest, to);
}

/** The language a public path is in (English when it has no prefix). */
export function langOfPath(pathname: string): Lang {
  return splitLang(pathname).lang ?? DEFAULT_LANG;
}
