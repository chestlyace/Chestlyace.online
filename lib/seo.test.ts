import { afterEach, describe, expect, it, vi } from "vitest";
import {
  imagePath,
  indexingEnabled,
  jsonLdText,
  mainJsonLd,
  pageMetadata,
  robotsTxt,
  siteMetadata,
  sitemapXml,
} from "./seo";

afterEach(() => vi.unstubAllEnvs());

const env = (vars: Record<string, string>) => vars as NodeJS.ProcessEnv;

describe("indexingEnabled", () => {
  it("is off unless SITE_INDEXING=on", () => {
    expect(indexingEnabled(env({}))).toBe(false);
    expect(indexingEnabled(env({ SITE_INDEXING: "off" }))).toBe(false);
    expect(indexingEnabled(env({ SITE_INDEXING: "on" }))).toBe(true);
  });

  it("is never on in a Vercel preview", () => {
    expect(
      indexingEnabled(env({ SITE_INDEXING: "on", VERCEL_ENV: "preview" })),
    ).toBe(false);
    expect(
      indexingEnabled(env({ SITE_INDEXING: "on", VERCEL_ENV: "production" })),
    ).toBe(true);
  });
});

describe("siteMetadata", () => {
  it("keeps both name forms in the main title and description", () => {
    const meta = siteMetadata("main");
    expect(meta.title).toBe(
      "Chestly Ace (Amahndong Chestly) — Software Engineer",
    );
    expect(String(meta.description)).toContain("Amahndong Chestly");
    expect(meta.alternates?.canonical).toBe("/");
    expect(meta.metadataBase?.toString()).toMatch(/^https?:\/\/[^/]+\/$/);
  });

  it("is noindex until indexing is switched on, and index after", () => {
    expect(siteMetadata("main").robots).toEqual({
      index: false,
      follow: false,
    });
    vi.stubEnv("SITE_INDEXING", "on");
    expect(siteMetadata("blog").robots).toEqual({ index: true, follow: true });
  });

  it("has Open Graph and Twitter tags on every site", () => {
    for (const site of ["main", "creatives", "blog"] as const) {
      const meta = siteMetadata(site);
      expect(meta.openGraph).toMatchObject({ type: "website", url: "/" });
      expect(meta.twitter).toMatchObject({ title: meta.title });
    }
  });

  it("gives only the main site an image for now", () => {
    expect(siteMetadata("main").openGraph?.images).toEqual([
      { url: "/og/main.webp", width: 1200, height: 1600 },
    ]);
    expect(siteMetadata("blog").openGraph?.images).toBeUndefined();
  });
});

describe("pageMetadata", () => {
  it("sets its own canonical address and uses the page image", () => {
    const meta = pageMetadata("main", {
      path: "/projects/alexdy",
      title: "Alexdy — Chestly Ace",
      description: "A marketplace.",
      image: "https://res.cloudinary.com/x/image/upload/a.png",
    });
    expect(meta.alternates?.canonical).toBe("/projects/alexdy");
    expect(meta.openGraph?.images).toEqual([
      { url: "https://res.cloudinary.com/x/image/upload/a.png" },
    ]);
  });

  it("falls back to the site image when the page has none", () => {
    const meta = pageMetadata("main", {
      path: "/projects/a",
      title: "A",
      description: "d",
      image: null,
    });
    expect(meta.openGraph?.images).toEqual([{ url: "/og/main.webp" }]);
  });
});

describe("imagePath", () => {
  it("leaves web addresses and roots bare file names", () => {
    expect(imagePath("https://a.example/x.png")).toBe(
      "https://a.example/x.png",
    );
    expect(imagePath("logos/a.png")).toBe("/logos/a.png");
    expect(imagePath("/certs/a.png")).toBe("/certs/a.png");
  });
});

const profile = {
  name: "Chestly Ace",
  legalName: "Amahndong Chestly",
  heroImageUrl: "hero.webp",
} as never;
const social = (url: string) => ({ url, platform: "x" }) as never;
const faq = (question: string, answer: string) =>
  ({ question, answer }) as never;

describe("mainJsonLd", () => {
  const origin = "https://chestlyace.online";

  it("is a Person, a WebSite and a FAQPage in one graph", () => {
    const data = mainJsonLd(
      {
        profile,
        socials: [
          social("https://github.com/chestlyace"),
          social("javascript:alert(1)"),
        ],
        faqs: [faq("Do you freelance?", "Yes.")],
      },
      origin,
    ) as { "@context": string; "@graph": Record<string, unknown>[] };

    expect(data["@context"]).toBe("https://schema.org");
    const [person, site, faqPage] = data["@graph"];
    expect(person).toMatchObject({
      "@type": "Person",
      "@id": `${origin}/#person`,
      name: "Chestly Ace",
      alternateName: "Amahndong Chestly",
      jobTitle: "Software Engineer",
      url: `${origin}/`,
      image: `${origin}/hero.webp`,
      sameAs: ["https://github.com/chestlyace"],
    });
    expect(site).toMatchObject({
      "@type": "WebSite",
      url: `${origin}/`,
      publisher: { "@id": `${origin}/#person` },
    });
    expect(faqPage).toMatchObject({
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "Do you freelance?",
          acceptedAnswer: { "@type": "Answer", text: "Yes." },
        },
      ],
    });
  });

  it("leaves out the FAQPage and sameAs when there is nothing to list", () => {
    const data = mainJsonLd(
      { profile, socials: [], faqs: [] },
      origin,
    ) as Record<string, unknown>;
    // What the page carries is the JSON text, where undefined values are gone.
    const graph = JSON.parse(jsonLdText(data))["@graph"];
    expect(graph).toHaveLength(2);
    expect(graph[0]).not.toHaveProperty("sameAs");
  });

  it("is null without a profile", () => {
    expect(
      mainJsonLd({ profile: undefined, socials: [], faqs: [] } as never),
    ).toBeNull();
  });
});

describe("jsonLdText", () => {
  it("cannot close the script tag", () => {
    const text = jsonLdText({ a: "</script><script>alert(1)</script>" });
    expect(text).not.toContain("</script>");
    expect(JSON.parse(text)).toEqual({
      a: "</script><script>alert(1)</script>",
    });
  });
});

describe("sitemapXml", () => {
  it("lists each address and escapes what XML needs escaped", () => {
    const xml = sitemapXml([
      "https://chestlyace.online/",
      "https://x.vercel.app/?site=main&a=1",
    ]);
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain("<loc>https://chestlyace.online/</loc>");
    expect(xml).toContain("<loc>https://x.vercel.app/?site=main&amp;a=1</loc>");
  });
});

describe("robotsTxt", () => {
  it("disallows everything until indexing is on", () => {
    expect(robotsTxt("main", env({}))).toBe("User-agent: *\nDisallow: /\n");
    expect(
      robotsTxt("blog", env({ SITE_INDEXING: "on", VERCEL_ENV: "preview" })),
    ).toBe("User-agent: *\nDisallow: /\n");
  });

  it("opens the public sites and names the sitemap once it is on", () => {
    const text = robotsTxt("main", env({ SITE_INDEXING: "on" }));
    expect(text).toContain("Allow: /\n");
    expect(text).toContain("Disallow: /api/");
    expect(text).toMatch(/Sitemap: https?:\/\/[^\s]+\/sitemap\.xml/);
  });
});
