export const SITES = {
  main: { host: "chestlyace.online", devHost: "localhost:3000" },
  creatives: {
    host: "creatives.chestlyace.online",
    devHost: "creatives.localhost:3000",
  },
  blog: { host: "blog.chestlyace.online", devHost: "blog.localhost:3000" },
  // The owner's panel (D71): a host of its own, never listed in the public
  // Sites menu or footer.
  admin: {
    host: "admin.chestlyace.online",
    devHost: "admin.localhost:3000",
  },
} as const;

export type SiteKey = keyof typeof SITES;

export const SITE_KEYS = Object.keys(SITES) as SiteKey[];

// The sites visitors can go to: what the Sites menu and the footer list.
export type PublicSiteKey = Exclude<SiteKey, "admin">;
export const PUBLIC_SITE_KEYS = SITE_KEYS.filter(
  (key): key is PublicSiteKey => key !== "admin",
);

export const SITE_LABELS: Record<SiteKey, string> = {
  main: "Dev",
  creatives: "Creatives",
  blog: "Blog",
  admin: "Admin",
};

export const PREVIEW_SITE_COOKIE = "preview-site";

export function isSiteKey(value: unknown): value is SiteKey {
  return typeof value === "string" && Object.hasOwn(SITES, value);
}

function hostname(host: string): string {
  return host.split(":")[0].toLowerCase();
}

export function siteFromHost(host: string | null | undefined): SiteKey {
  if (!host) return "main";
  const name = hostname(host);
  for (const key of SITE_KEYS) {
    const site = SITES[key];
    if (name === hostname(site.host) || name === hostname(site.devHost)) {
      return key;
    }
  }
  return "main";
}

const URL_OVERRIDES: Record<SiteKey, string | undefined> = {
  main: process.env.NEXT_PUBLIC_MAIN_URL,
  creatives: process.env.NEXT_PUBLIC_CREATIVES_URL,
  blog: process.env.NEXT_PUBLIC_BLOG_URL,
  admin: process.env.NEXT_PUBLIC_ADMIN_URL,
};

export function siteUrl(site: SiteKey, path = "/"): string {
  const override = URL_OVERRIDES[site];
  if (override) return new URL(path, override).toString();

  // Vercel previews serve every site from one branch URL, selected by ?site=.
  const branchUrl = process.env.VERCEL_BRANCH_URL;
  if (process.env.VERCEL_ENV === "preview" && branchUrl) {
    const url = new URL(path, `https://${branchUrl}`);
    url.searchParams.set("site", site);
    return url.toString();
  }

  const base =
    process.env.NODE_ENV === "development"
      ? `http://${SITES[site].devHost}`
      : `https://${SITES[site].host}`;
  return new URL(path, base).toString();
}

export type RoutingInput = {
  host: string | null;
  pathname: string;
  /** The query string with its "?", when there is one. */
  search?: string;
  siteParam: string | null;
  siteCookie: string | undefined;
  allowOverride: boolean;
};

export type RoutingDecision =
  | { kind: "not-found" }
  | { kind: "redirect"; location: string }
  | { kind: "pass-through"; site: SiteKey }
  | {
      kind: "rewrite";
      site: SiteKey;
      pathname: string;
      setPreviewCookie?: SiteKey;
    };

// Every API route answers on one host (D71); on any other host it is a 404.
// Anything not listed here is main's. `/api/revalidate` (the creatives CMS
// webhook) is the one that doesn't care which host it arrives on.
const API_OWNERS: [prefix: string, owner: SiteKey | "any"][] = [
  ["/api/auth", "admin"],
  ["/api/admin", "admin"],
  ["/api/revalidate", "any"],
  ["/api/contact", "main"],
  ["/api/blog", "blog"],
];

function apiOwner(pathname: string): SiteKey | "any" {
  for (const [prefix, owner] of API_OWNERS) {
    if (startsWithSegment(pathname, prefix)) return owner;
  }
  return "main";
}

function startsWithSegment(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

// Old addresses on the main host (ia-content.md §6). The old site's pages are
// sections now, the design and photography pages live on the creatives site, and
// the admin has its own host. Matching ignores a trailing slash.
function legacyDestination(pathname: string): string | null {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  switch (path) {
    case "/software-development.html":
      return siteUrl("main", "/#services");
    case "/graphic-design.html":
    case "/photography.html":
      return siteUrl("creatives", "/services");
  }
  if (path === "/admin" || startsWithSegment(path, "/admin")) {
    return siteUrl("admin", "/");
  }
  return null;
}

export function decideRoute(input: RoutingInput): RoutingDecision {
  // www.chestlyace.online is the same site: one address for search engines.
  if (
    input.host &&
    hostname(input.host) === `www.${hostname(SITES.main.host)}`
  ) {
    return {
      kind: "redirect",
      location: new URL(
        input.pathname + (input.search ?? ""),
        siteUrl("main"),
      ).toString(),
    };
  }

  let site = siteFromHost(input.host);
  let setPreviewCookie: SiteKey | undefined;

  if (input.allowOverride) {
    if (isSiteKey(input.siteParam)) {
      site = input.siteParam;
      setPreviewCookie = input.siteParam;
    } else if (isSiteKey(input.siteCookie)) {
      site = input.siteCookie;
    }
  }

  if (startsWithSegment(input.pathname, "/api")) {
    const owner = apiOwner(input.pathname);
    if (owner !== "any" && owner !== site) return { kind: "not-found" };
    return { kind: "pass-through", site };
  }

  if (site === "main") {
    const destination = legacyDestination(input.pathname);
    if (destination) return { kind: "redirect", location: destination };
  }

  const pathname =
    input.pathname === "/"
      ? `/sites/${site}`
      : `/sites/${site}${input.pathname}`;
  return { kind: "rewrite", site, pathname, setPreviewCookie };
}
