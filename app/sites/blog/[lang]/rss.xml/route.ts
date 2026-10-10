import { getCachedPosts } from "@/lib/blog/cache";
import { writtenIn } from "@/lib/blog/localizePost";
import { rssXml } from "@/lib/blog/seo";
import { isLang } from "@/lib/i18n";
import { siteOrigin, textResponse } from "@/lib/seo";

// The RSS feed (ia-content.md §1): `/rss.xml` in English, `/fr/rss.xml` in French,
// which lists only the posts that have a French version (docs/i18n.md §6).
export async function GET(
  _request: Request,
  { params }: RouteContext<"/sites/blog/[lang]/rss.xml">,
) {
  const { lang } = await params;
  if (!isLang(lang)) return new Response("Not found", { status: 404 });
  const posts = writtenIn(await getCachedPosts(lang), lang);
  return textResponse(
    rssXml(posts, siteOrigin("blog"), lang),
    "application/rss+xml",
  );
}
