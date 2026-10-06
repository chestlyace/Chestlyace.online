export const SITES = {
  main: { host: "chestlyace.online", devHost: "localhost:3000" },
  creatives: {
    host: "creatives.chestlyace.online",
    devHost: "creatives.localhost:3000",
  },
  blog: { host: "blog.chestlyace.online", devHost: "blog.localhost:3000" },
} as const;

export type SiteKey = keyof typeof SITES;

export const SITE_KEYS = Object.keys(SITES) as SiteKey[];

export const SITE_LABELS: Record<SiteKey, string> = {
  main: "Dev",
  creatives: "Creatives",
  blog: "Blog",
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
  siteParam: string | null;
  siteCookie: string | undefined;
  allowOverride: boolean;
};

export type RoutingDecision =
  | { kind: "not-found" }
  | { kind: "pass-through" }
  | {
      kind: "rewrite";
      site: SiteKey;
      pathname: string;
      setPreviewCookie?: SiteKey;
    };

const MAIN_ONLY_PREFIXES = ["/api", "/admin"];

function startsWithSegment(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function decideRoute(input: RoutingInput): RoutingDecision {
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

  const mainOnly = MAIN_ONLY_PREFIXES.some((prefix) =>
    startsWithSegment(input.pathname, prefix),
  );
  if (mainOnly && site !== "main") return { kind: "not-found" };
  if (startsWithSegment(input.pathname, "/api"))
    return { kind: "pass-through" };

  const pathname =
    input.pathname === "/"
      ? `/sites/${site}`
      : `/sites/${site}${input.pathname}`;
  return { kind: "rewrite", site, pathname, setPreviewCookie };
}
