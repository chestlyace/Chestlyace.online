import { BlogNotFound } from "@/components/notfound/NotFound";
import { getCachedPosts } from "@/lib/blog/cache";
import { isoDate } from "@/lib/blog/format";

// The blog's 404 (design.md §13.67): the latest posts, in both languages (the page picks
// the visitor's, since a not-found page is given no route params).
export default async function NotFound() {
  const [en, fr] = await Promise.all([
    getCachedPosts("en"),
    getCachedPosts("fr"),
  ]);
  const pick = (posts: typeof en) =>
    posts.slice(0, 3).map((post) => ({
      slug: post.slug,
      title: post.title,
      date: isoDate(post.publishedAt),
    }));
  return <BlogNotFound posts={{ en: pick(en), fr: pick(fr) }} />;
}
