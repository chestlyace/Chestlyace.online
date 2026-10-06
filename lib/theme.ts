export const THEME_COOKIE = "theme";

export const THEME_PREFERENCES = ["system", "light", "dark"] as const;
export type ThemePreference = (typeof THEME_PREFERENCES)[number];

export const THEME_LABELS: Record<ThemePreference, string> = {
  system: "System",
  light: "Light",
  dark: "Dark",
};

export const THEME_COLORS = { light: "#FFFFFF", dark: "#0A0A0A" } as const;

const ROOT_DOMAIN = "chestlyace.online";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;
const DARK_QUERY = "(prefers-color-scheme: dark)";

export function parseThemePreference(
  value: string | null | undefined,
): ThemePreference {
  return THEME_PREFERENCES.find((p) => p === value) ?? "system";
}

export function nextThemePreference(current: ThemePreference): ThemePreference {
  const index = THEME_PREFERENCES.indexOf(current);
  return THEME_PREFERENCES[(index + 1) % THEME_PREFERENCES.length];
}

// Browsers only share a cookie across subdomains of a real registrable domain,
// so *.localhost and preview hosts keep a host-only cookie.
export function themeCookieDomain(hostname: string): string | undefined {
  return hostname === ROOT_DOMAIN || hostname.endsWith(`.${ROOT_DOMAIN}`)
    ? `.${ROOT_DOMAIN}`
    : undefined;
}

export function themeCookieValue(cookieHeader: string): string | undefined {
  const match = cookieHeader.match(
    new RegExp(`(?:^|;\\s*)${THEME_COOKIE}=([^;]*)`),
  );
  return match?.[1];
}

export function readThemePreference(): ThemePreference {
  return parseThemePreference(themeCookieValue(document.cookie));
}

export function writeThemePreference(preference: ThemePreference): void {
  const domain = themeCookieDomain(window.location.hostname);
  document.cookie = [
    `${THEME_COOKIE}=${preference}`,
    "Path=/",
    `Max-Age=${ONE_YEAR_SECONDS}`,
    "SameSite=Lax",
    ...(domain ? [`Domain=${domain}`] : []),
  ].join("; ");
}

export function applyTheme(preference: ThemePreference): void {
  const dark =
    preference === "dark" ||
    (preference === "system" && window.matchMedia(DARK_QUERY).matches);
  const root = document.documentElement;
  root.classList.toggle("dark", dark);
  root.style.colorScheme = dark ? "dark" : "light";
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", dark ? THEME_COLORS.dark : THEME_COLORS.light);
}

// Inlined in <head> so the right theme is set before first paint.
// Must stay self-contained: it runs before any bundle loads.
export const THEME_INIT_SCRIPT = `(function(){try{var m=document.cookie.match(/(?:^|;\\s*)${THEME_COOKIE}=(light|dark|system)(?:;|$)/);var p=m?m[1]:"system";var d=p==="dark"||(p==="system"&&window.matchMedia("${DARK_QUERY}").matches);var r=document.documentElement;r.classList.toggle("dark",d);r.style.colorScheme=d?"dark":"light";var t=document.querySelector('meta[name="theme-color"]');if(!t){t=document.createElement("meta");t.name="theme-color";document.head.appendChild(t);}t.setAttribute("content",d?"${THEME_COLORS.dark}":"${THEME_COLORS.light}");}catch(e){}})();`;
