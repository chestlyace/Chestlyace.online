import { unstable_cache } from "next/cache";
import { getDb } from "@/lib/db";
import {
  getAgentSession,
  getNewsletterCopy,
  getPublishedPost,
  listBlogSocials,
  listPostsByTag,
  listPublishedPosts,
  listTags,
} from "./data";

// Cached reads for the blog pages, like lib/portfolio.ts for the main site: a
// page stays static until something changes. Every write in the admin (9b.3)
// calls revalidateTag(BLOG_TAG).
export const BLOG_TAG = "blog";

const deployment = process.env.VERCEL_GIT_COMMIT_SHA ?? "local";

// In `next dev` reads are never cached, so edits show on the next refresh.
function cached<Args extends unknown[], Result>(
  name: string,
  read: (...args: Args) => Promise<Result>,
) {
  if (process.env.NODE_ENV === "development") return read;
  return unstable_cache(read, ["blog", name, deployment], { tags: [BLOG_TAG] });
}

export const getCachedPosts = cached("posts", () =>
  listPublishedPosts(getDb()),
);
export const getCachedPost = cached("post", (slug: string) =>
  getPublishedPost(getDb(), slug),
);
export const getCachedTags = cached("tags", () => listTags(getDb()));
export const getCachedPostsByTag = cached("by-tag", (tag: string) =>
  listPostsByTag(getDb(), tag),
);
export const getCachedBlogSocials = cached("socials", () =>
  listBlogSocials(getDb()),
);
export const getCachedSession = cached("session", (id: string) =>
  getAgentSession(getDb(), id),
);
export const getCachedNewsletterCopy = cached("newsletter", () =>
  getNewsletterCopy(getDb()),
);
