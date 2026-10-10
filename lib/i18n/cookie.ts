import type { Lang } from "./index";

// The `lang` cookie (docs/i18n.md §7): remembers a visitor's choice (the switcher) or
// their "no thanks" to the French suggestion. It never redirects anyone; it only stops
// the suggestion from showing again. Shared by the sites of one domain: on
// `blog.example.com` it is set for `.example.com`.

export const LANG_COOKIE = "lang";
const YEAR = 60 * 60 * 24 * 365;

/** The domain to share the cookie across the sites, or undefined (localhost, an IP). */
export function cookieDomain(hostname: string): string | undefined {
  const host = hostname.split(":")[0];
  if (host === "localhost" || host.endsWith(".localhost")) return undefined;
  if (/^\d+(\.\d+){3}$/.test(host) || host.includes(":")) return undefined;
  const parts = host.split(".");
  return parts.length > 2 ? `.${parts.slice(-2).join(".")}` : undefined;
}

/** The `Set-Cookie`-style string `document.cookie` takes for a choice. */
export function langCookie(lang: Lang, hostname: string): string {
  const domain = cookieDomain(hostname);
  return `${LANG_COOKIE}=${lang}; path=/; max-age=${YEAR}; samesite=lax${domain ? `; domain=${domain}` : ""}`;
}

/** The language in a `document.cookie` string, if the cookie is there. */
export function readLangCookie(cookies: string): Lang | null {
  const match = cookies.match(
    new RegExp(`(?:^|;\\s*)${LANG_COOKIE}=(en|fr)\\b`),
  );
  return (match?.[1] as Lang | undefined) ?? null;
}

/** Whether a browser's preferred languages put French first (`["fr-CA", "en"]`). */
export function prefersFrench(
  languages: readonly string[] | undefined,
): boolean {
  const first = languages?.[0]?.toLowerCase();
  return first === "fr" || first?.startsWith("fr-") === true;
}
