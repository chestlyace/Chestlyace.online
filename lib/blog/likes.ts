import { createHash, randomBytes } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import * as schema from "@/db/schema";
import type { Database } from "@/lib/db";

// Likes (design.md §13.35, content-schema.md §4): anyone can like a post, no
// account. The visitor is a random token in a first-party cookie; only its hash is
// stored, so the table holds nothing that names a person. One like per browser,
// and liking again takes it back.
const { blogLikes, blogPosts } = schema;

export const VISITOR_COOKIE = "blog_visitor";

export const newVisitorToken = () => randomBytes(24).toString("base64url");

export const isVisitorToken = (value: unknown): value is string =>
  typeof value === "string" && /^[A-Za-z0-9_-]{20,64}$/.test(value);

export const hashVisitor = (token: string) =>
  createHash("sha256").update(token).digest("hex");

export type LikeState = { count: number; liked: boolean };

// Only a published post can be liked; anything else is `null`.
async function publishedPost(db: Database, slug: string) {
  const [post] = await db
    .select({ id: blogPosts.id, count: blogPosts.likeCount })
    .from(blogPosts)
    .where(and(eq(blogPosts.slug, slug), eq(blogPosts.status, "published")))
    .limit(1);
  return post ?? null;
}

export async function getLikeState(
  db: Database,
  slug: string,
  visitorHash: string | null,
): Promise<LikeState | null> {
  const post = await publishedPost(db, slug);
  if (!post) return null;
  if (!visitorHash) return { count: post.count, liked: false };
  const [row] = await db
    .select({ postId: blogLikes.postId })
    .from(blogLikes)
    .where(
      and(
        eq(blogLikes.postId, post.id),
        eq(blogLikes.visitorHash, visitorHash),
      ),
    )
    .limit(1);
  return { count: post.count, liked: Boolean(row) };
}

// Likes, or takes the like back; the count is kept in step in the same transaction.
export async function toggleLike(
  db: Database,
  slug: string,
  visitorHash: string,
): Promise<LikeState | null> {
  const post = await publishedPost(db, slug);
  if (!post) return null;

  return db.transaction(async (tx) => {
    const removed = await tx
      .delete(blogLikes)
      .where(
        and(
          eq(blogLikes.postId, post.id),
          eq(blogLikes.visitorHash, visitorHash),
        ),
      )
      .returning({ postId: blogLikes.postId });

    let liked: boolean;
    if (removed.length > 0) {
      liked = false;
    } else {
      const added = await tx
        .insert(blogLikes)
        .values({ postId: post.id, visitorHash })
        .onConflictDoNothing()
        .returning({ postId: blogLikes.postId });
      liked = added.length > 0;
      // A like that was already there (a double click racing) changes nothing.
      if (!liked) return { count: post.count, liked: true };
    }

    const [updated] = await tx
      .update(blogPosts)
      .set({
        likeCount: sql`greatest(${blogPosts.likeCount} + ${liked ? 1 : -1}, 0)`,
      })
      .where(eq(blogPosts.id, post.id))
      .returning({ count: blogPosts.likeCount });
    return { count: updated.count, liked };
  });
}
