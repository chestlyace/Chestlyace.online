import { imagePath, siteOrigin } from "@/lib/seo";
import { siteUrl } from "@/lib/sites";
import type { Post, PostSummary } from "./data";

// What search engines and feed readers get from the blog (ia-content.md §4):
// `Blog` and `BlogPosting` structured data, the RSS feed, and the sitemap.

type JsonLd = Record<string, unknown>;

const BLOG_TITLE = "Chestly Ace — Blog";
const BLOG_DESCRIPTION =
  "Writing on software engineering, web development, and building things.";

// The author is the same Person as on the main site (its @id).
const authorOf = () => ({ "@id": `${siteOrigin("main")}/#person` });

export function blogJsonLd(origin: string = siteOrigin("blog")): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": `${origin}/#blog`,
    url: `${origin}/`,
    name: BLOG_TITLE,
    description: BLOG_DESCRIPTION,
    inLanguage: "en",
    publisher: authorOf(),
  };
}

export function blogPostingJsonLd(
  post: Post,
  origin: string = siteOrigin("blog"),
): JsonLd {
  const url = post.canonicalUrl ?? `${origin}/${post.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${origin}/${post.slug}#post`,
    mainEntityOfPage: url,
    url,
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    image: post.coverUrl
      ? new URL(imagePath(post.coverUrl), origin).toString()
      : undefined,
    keywords: post.tags.length > 0 ? post.tags.join(", ") : undefined,
    inLanguage: "en",
    isPartOf: { "@id": `${origin}/#blog` },
    author: authorOf(),
    publisher: authorOf(),
  };
}

const escapeXml = (text: string) =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const rfc822 = (timestamp: string) => new Date(timestamp).toUTCString();

// RSS 2.0, newest first: title, address, date, tags and the description (the
// full text lives on the site).
export function rssXml(
  posts: readonly PostSummary[],
  origin: string = siteOrigin("blog"),
): string {
  const items = posts
    .map((post) => {
      const link = `${origin}/${post.slug}`;
      return [
        "    <item>",
        `      <title>${escapeXml(post.title)}</title>`,
        `      <link>${escapeXml(link)}</link>`,
        `      <guid isPermaLink="true">${escapeXml(link)}</guid>`,
        `      <pubDate>${rfc822(post.publishedAt)}</pubDate>`,
        `      <description>${escapeXml(post.description)}</description>`,
        ...post.tags.map(
          (tag) => `      <category>${escapeXml(tag)}</category>`,
        ),
        "    </item>",
      ].join("\n");
    })
    .join("\n");
  const built = posts[0]
    ? rfc822(posts[0].updatedAt)
    : rfc822(new Date(0).toISOString());
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(BLOG_TITLE)}</title>
    <link>${escapeXml(`${origin}/`)}</link>
    <description>${escapeXml(BLOG_DESCRIPTION)}</description>
    <language>en</language>
    <lastBuildDate>${built}</lastBuildDate>
    <atom:link href="${escapeXml(`${origin}/rss.xml`)}" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>
`;
}

// The blog's sitemap addresses: the home, and (once there are posts) the tags
// index, every post and every tag.
export function blogSitemapUrls(
  posts: readonly Pick<PostSummary, "slug">[],
  tags: readonly string[],
): string[] {
  return [
    siteUrl("blog", "/"),
    ...(tags.length > 0 ? [siteUrl("blog", "/tags")] : []),
    ...posts.map((post) => siteUrl("blog", `/${post.slug}`)),
    ...tags.map((tag) => siteUrl("blog", `/tags/${tag}`)),
  ];
}
