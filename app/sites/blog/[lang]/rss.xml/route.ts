import { getCachedPosts } from "@/lib/blog/cache";
import { rssXml } from "@/lib/blog/seo";
import { textResponse } from "@/lib/seo";

// The RSS feed (ia-content.md §1).
export async function GET() {
  return textResponse(rssXml(await getCachedPosts()), "application/rss+xml");
}
