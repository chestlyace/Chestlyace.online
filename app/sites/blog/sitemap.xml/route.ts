import { getCachedPosts, getCachedTags } from "@/lib/blog/cache";
import { blogSitemapUrls } from "@/lib/blog/seo";
import { sitemapXml, textResponse } from "@/lib/seo";

// The home, the tags index, every post and every tag.
export async function GET() {
  const [posts, tags] = await Promise.all([
    getCachedPosts("en"),
    getCachedTags("en"),
  ]);
  return textResponse(
    sitemapXml(
      blogSitemapUrls(
        posts,
        tags.map((entry) => entry.tag),
      ),
    ),
    "application/xml",
  );
}
