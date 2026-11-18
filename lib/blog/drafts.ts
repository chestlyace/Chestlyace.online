import { eq } from "drizzle-orm";
import * as schema from "@/db/schema";
import { isShareToken } from "@/lib/admin/shareApi";
import type { Database } from "@/lib/db";
import type { Lang } from "@/lib/i18n";
import { frenchContent, summaryColumns, type Post } from "./data";
import { inLanguage, type FrenchColumns } from "./localizePost";

// A draft opened through its share link (D93, design.md §14.27). Never cached: the
// page always shows the last saved version, and a turned-off link stops at once.

const { blogPosts } = schema;

/** A draft as the shared page reads it: a post with no published date. */
export type SharedDraftPost = Omit<Post, "publishedAt"> & {
  publishedAt: null;
};

export type SharedDraft =
  /** The link is on and the post is a draft: show it. */
  | { kind: "draft"; post: SharedDraftPost }
  /** The link is on but the post is published: send the reader to the post. */
  | { kind: "published"; slug: string; lang: Lang };

/**
 * The post a share link opens, in `lang`, or null for a link that does not exist (an
 * unknown, renewed or turned-off token, or a deleted post): the page answers 404.
 */
export async function getSharedDraft(
  db: Database,
  token: string,
  lang: Lang = "en",
): Promise<SharedDraft | null> {
  if (!isShareToken(token)) return null;
  const [row] = await db
    .select({
      ...summaryColumns,
      status: blogPosts.status,
      content: blogPosts.content,
      frenchContent,
      canonicalUrl: blogPosts.canonicalUrl,
      commentsEnabled: blogPosts.commentsEnabled,
      likeCount: blogPosts.likeCount,
      series: blogPosts.series,
    })
    .from(blogPosts)
    .where(eq(blogPosts.shareToken, token))
    .limit(1);
  if (!row) return null;

  const { frenchContent: french, status, ...rest } = row;
  const localized = inLanguage(rest as typeof rest & FrenchColumns, lang);
  if (status === "published")
    return { kind: "published", slug: rest.slug, lang: localized.lang };

  const inFrench = localized.lang === "fr";
  return {
    kind: "draft",
    post: {
      ...localized,
      content: inFrench && french ? french : rest.content,
      canonicalUrl: null,
      publishedAt: null,
    } as SharedDraftPost,
  };
}
