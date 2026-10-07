import { describe, expect, it } from "vitest";
import type { Post, PostSummary } from "./data";
import { blogJsonLd, blogPostingJsonLd, blogSitemapUrls, rssXml } from "./seo";

const origin = "https://blog.chestlyace.online";

const summary = (
  slug: string,
  extra: Partial<PostSummary> = {},
): PostSummary => ({
  slug,
  title: `Title of ${slug}`,
  description: `About ${slug} & more`,
  coverUrl: null,
  coverAlt: null,
  tags: ["nextjs", "web"],
  publishedAt: "2026-10-20T09:00:00Z",
  updatedAt: "2026-11-02T10:00:00Z",
  readingMinutes: 3,
  ...extra,
});

const post = (extra: Partial<Post> = {}): Post => ({
  ...summary("hello"),
  content: "x",
  canonicalUrl: null,
  commentsEnabled: true,
  likeCount: 0,
  series: null,
  ...extra,
});

describe("blogPostingJsonLd", () => {
  it("is a BlogPosting by the main site's Person, in the blog", () => {
    const data = blogPostingJsonLd(
      post({ coverUrl: "/blog/hello/cover.webp" }),
      origin,
    );
    expect(data).toMatchObject({
      "@type": "BlogPosting",
      headline: "Title of hello",
      description: "About hello & more",
      datePublished: "2026-10-20T09:00:00Z",
      dateModified: "2026-11-02T10:00:00Z",
      url: `${origin}/hello`,
      image: `${origin}/blog/hello/cover.webp`,
      keywords: "nextjs, web",
      isPartOf: { "@id": `${origin}/#blog` },
    });
    expect((data.author as { "@id": string })["@id"]).toMatch(/\/#person$/);
  });

  it("uses the canonical address of a cross-posted post", () => {
    expect(
      blogPostingJsonLd(
        post({ canonicalUrl: "https://dev.to/me/hello" }),
        origin,
      ).url,
    ).toBe("https://dev.to/me/hello");
  });

  it("leaves out an image and keywords it doesn't have", () => {
    const text = JSON.stringify(blogPostingJsonLd(post({ tags: [] }), origin));
    expect(text).not.toContain("keywords");
    expect(text).not.toContain('"image"');
  });
});

describe("blogJsonLd", () => {
  it("is the Blog the posts belong to", () => {
    expect(blogJsonLd(origin)).toMatchObject({
      "@type": "Blog",
      "@id": `${origin}/#blog`,
    });
  });
});

describe("rssXml", () => {
  it("lists the posts with their address, date, tags and an escaped description", () => {
    const xml = rssXml([summary("a"), summary("b", { tags: [] })], origin);
    expect(xml).toContain('<rss version="2.0"');
    expect(xml).toContain(`<link>${origin}/a</link>`);
    expect(xml).toContain(`<guid isPermaLink="true">${origin}/a</guid>`);
    expect(xml).toContain("<pubDate>Tue, 20 Oct 2026 09:00:00 GMT</pubDate>");
    expect(xml).toContain("<description>About a &amp; more</description>");
    expect(xml).toContain("<category>nextjs</category>");
    expect(xml).toContain(`href="${origin}/rss.xml" rel="self"`);
    expect(xml.match(/<item>/g)).toHaveLength(2);
  });

  it("is a valid empty feed with no posts", () => {
    const xml = rssXml([], origin);
    expect(xml).toContain("<channel>");
    expect(xml).not.toContain("<item>");
  });
});

describe("blogSitemapUrls", () => {
  it("lists the home, the tags index, each post and each tag", () => {
    const urls = blogSitemapUrls([{ slug: "a" }, { slug: "b" }], ["web"]);
    expect(urls).toHaveLength(5);
    expect(urls[0]).toMatch(/blog\.chestlyace\.online\/$|localhost|vercel/);
    expect(urls.some((url) => url.includes("/tags/web"))).toBe(true);
    expect(urls.some((url) => url.endsWith("/a") || url.includes("/a?"))).toBe(
      true,
    );
  });

  it("is just the home before there are any posts", () => {
    expect(blogSitemapUrls([], [])).toHaveLength(1);
  });
});
