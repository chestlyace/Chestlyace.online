import type { Metadata } from "next";
import type { HomepageData } from "@/lib/db";
import { isHttpUrl } from "@/lib/links";
import { siteUrl, type PublicSiteKey } from "@/lib/sites";

// What search engines and link previews see (ia-content.md §4). Per-site titles,
// descriptions, canonical URLs and Open Graph tags; JSON-LD built from the
// database rows; and the text of each host's sitemap.xml and robots.txt.

// Nothing is indexable until the owner turns indexing on at launch (Phase 8):
// SITE_INDEXING=main (or "main,blog") opens those sites, "on" or "all" opens
// every public site. Vercel previews never are, whatever the variable says.
export function indexingEnabled(
  site: PublicSiteKey,
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  if (env.VERCEL_ENV === "preview") return false;
  const value = (env.SITE_INDEXING ?? "").toLowerCase();
  if (value === "on" || value === "all") return true;
  return value
    .split(",")
    .map((name) => name.trim())
    .includes(site);
}

export const PERSON_NAME = "Chestly Ace";
export const PERSON_LEGAL_NAME = "Amahndong Chestly";

// Both name forms stay in titles, descriptions and structured data: the old site
// deliberately targeted both.
const SITE_COPY: Record<
  PublicSiteKey,
  { title: string; description: string; image?: OgImage }
> = {
  main: {
    title: `${PERSON_NAME} (${PERSON_LEGAL_NAME}) — Software Engineer`,
    description: `${PERSON_NAME} (${PERSON_LEGAL_NAME}) is a software engineer building fast, reliable web applications, backends, and APIs. Open to remote roles.`,
    image: { path: "/og/main.webp", width: 1200, height: 1600 },
  },
  creatives: {
    title: `${PERSON_NAME} — Design & Photography`,
    description: `Graphic design, branding, and photography by ${PERSON_NAME} (${PERSON_LEGAL_NAME}).`,
  },
  blog: {
    title: `${PERSON_NAME} — Blog`,
    description:
      "Writing on software engineering, web development, and building things.",
  },
};

type OgImage = { path: string; width: number; height: number };

export function siteOrigin(site: PublicSiteKey): string {
  return new URL(siteUrl(site)).origin;
}

// An image address from the database: a full URL (Cloudinary) stays as it is, a
// file name from the old site is served from the site root.
export function imagePath(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `/${url.replace(/^\/+/, "")}`;
}

export function robotsMeta(
  site: PublicSiteKey,
  env: NodeJS.ProcessEnv = process.env,
) {
  return indexingEnabled(site, env)
    ? { index: true, follow: true }
    : { index: false, follow: false };
}

// A site's layout metadata: its title and description, the canonical address of
// every page (relative to `metadataBase`), and the Open Graph and Twitter tags.
export function siteMetadata(site: PublicSiteKey): Metadata {
  const { title, description, image } = SITE_COPY[site];
  const images = image
    ? [{ url: image.path, width: image.width, height: image.height }]
    : undefined;
  return {
    metadataBase: new URL(siteOrigin(site)),
    title,
    description,
    alternates: { canonical: "/" },
    robots: robotsMeta(site),
    openGraph: {
      type: "website",
      siteName: PERSON_NAME,
      title,
      description,
      url: "/",
      locale: "en_US",
      images,
    },
    // The main image is portrait, so the small card is the one that shows it whole.
    twitter: {
      card: image ? "summary" : "summary_large_image",
      title,
      description,
      images: image ? [image.path] : undefined,
    },
  };
}

// A page of a site: its own title and description, and its own canonical address.
export function pageMetadata(
  site: PublicSiteKey,
  page: {
    path: string;
    title: string;
    description: string;
    image?: string | null;
  },
): Metadata {
  const images = page.image
    ? [{ url: imagePath(page.image) }]
    : SITE_COPY[site].image
      ? [{ url: SITE_COPY[site].image.path }]
      : undefined;
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: page.path },
    openGraph: {
      type: "website",
      siteName: PERSON_NAME,
      title: page.title,
      description: page.description,
      url: page.path,
      locale: "en_US",
      images,
    },
    twitter: {
      card: page.image ? "summary_large_image" : "summary",
      title: page.title,
      description: page.description,
      images: images?.map((image) => image.url),
    },
  };
}

type JsonLd = Record<string, unknown>;

// Person + WebSite + FAQPage for the main site, as one @graph. Built on the
// server from the database rows; the old site built it in the browser.
export function mainJsonLd(
  data: Pick<HomepageData, "profile" | "socials" | "faqs">,
  origin: string = siteOrigin("main"),
): JsonLd | null {
  const { profile, socials, faqs } = data;
  if (!profile) return null;

  const personId = `${origin}/#person`;
  const sameAs = socials
    .map((social) => social.url)
    .filter((url) => isHttpUrl(url));

  const person: JsonLd = {
    "@type": "Person",
    "@id": personId,
    name: profile.name,
    alternateName: profile.legalName ?? undefined,
    jobTitle: "Software Engineer",
    url: `${origin}/`,
    image: profile.heroImageUrl
      ? new URL(imagePath(profile.heroImageUrl), origin).toString()
      : undefined,
    sameAs: sameAs.length > 0 ? sameAs : undefined,
  };

  const graph: JsonLd[] = [
    person,
    {
      "@type": "WebSite",
      "@id": `${origin}/#website`,
      url: `${origin}/`,
      name: SITE_COPY.main.title,
      description: SITE_COPY.main.description,
      inLanguage: "en",
      publisher: { "@id": personId },
    },
  ];

  if (faqs.length > 0) {
    graph.push({
      "@type": "FAQPage",
      "@id": `${origin}/#faq`,
      mainEntity: faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: { "@type": "Answer", text: faq.answer },
      })),
    });
  }

  return { "@context": "https://schema.org", "@graph": graph };
}

// JSON for a <script type="application/ld+json">: `<` is escaped so no value
// from the database can close the tag.
export function jsonLdText(value: JsonLd): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

const xmlEscape = (text: string) =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export function sitemapXml(urls: string[]): string {
  const entries = urls
    .map((url) => `  <url>\n    <loc>${xmlEscape(url)}</loc>\n  </url>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;
}

// The host's robots.txt: everything open and the sitemap listed once indexing is
// on; otherwise everything closed. (The admin has its own file: always closed.)
export function robotsTxt(
  site: PublicSiteKey,
  env: NodeJS.ProcessEnv = process.env,
): string {
  if (!indexingEnabled(site, env)) {
    return "User-agent: *\nDisallow: /\n";
  }
  return `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${siteUrl(site, "/sitemap.xml")}\n`;
}

export function textResponse(body: string, type: string): Response {
  return new Response(body, {
    headers: { "Content-Type": `${type}; charset=utf-8` },
  });
}
