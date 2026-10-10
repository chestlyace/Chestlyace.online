import { getCachedPosts, getCachedTags } from "@/lib/blog/cache";
import { writtenIn } from "@/lib/blog/localizePost";
import { siteUrl } from "@/lib/sites";
import { bothLanguages, sitemapXml, textResponse } from "@/lib/seo";

// The home, the tags index, every post and every tag. The French address of a post, of a
// tag and of the tags index is listed only when French exists for it; the others are
// English only (docs/i18n.md §5, §6).
export async function GET() {
  const [posts, frenchPosts, tags, frenchTags] = await Promise.all([
    getCachedPosts("en"),
    getCachedPosts("fr"),
    getCachedTags("en"),
    getCachedTags("fr"),
  ]);
  const withFrench = new Set(
    writtenIn(frenchPosts, "fr").map((post) => post.slug),
  );
  const frenchTagNames = new Set(frenchTags.map((entry) => entry.tag));
  const page = (path: string, french: boolean) =>
    french ? bothLanguages("blog", path) : [siteUrl("blog", path)];
  return textResponse(
    sitemapXml([
      ...bothLanguages("blog", "/"),
      ...(tags.length > 0 ? page("/tags", frenchTags.length > 0) : []),
      ...posts.flatMap((post) =>
        page(`/${post.slug}`, withFrench.has(post.slug)),
      ),
      ...tags.flatMap(({ tag }) =>
        page(`/tags/${tag}`, frenchTagNames.has(tag)),
      ),
    ]),
    "application/xml",
  );
}
