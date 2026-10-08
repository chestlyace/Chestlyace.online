import { and, desc, eq, sql } from "drizzle-orm";
import * as schema from "@/db/schema";
import type { Database } from "@/lib/db";

// The owner's comment moderation (design.md §13.50), apart from HTTP: find, hide,
// show and delete comments, ban a reader, and mark an account as the author's.
const { blogComments, blogPosts, readerUser } = schema;

export type ModerationFilter = "all" | "reported" | "hidden";

export type ModerationRow = {
  id: number;
  parentId: number | null;
  body: string;
  status: "visible" | "hidden";
  createdAt: string;
  reports: number;
  replies: number;
  post: { id: number; title: string; slug: string };
  reader: {
    id: string;
    name: string;
    image: string | null;
    provider: string | null;
    banned: boolean;
    isAuthor: boolean;
  } | null;
};

const LIMIT = 200;

export async function listForModeration(
  db: Database,
  filter: ModerationFilter,
): Promise<ModerationRow[]> {
  const reports = sql<number>`(select count(*)::int from blog_comment_reports r where r.comment_id = ${blogComments.id})`;
  const replies = sql<number>`(select count(*)::int from blog_comments c where c.parent_id = ${blogComments.id})`;
  const provider = sql<
    string | null
  >`(select a.provider_id from reader_account a where a.user_id = ${blogComments.userId} order by a.created_at limit 1)`;

  const rows = await db
    .select({
      id: blogComments.id,
      parentId: blogComments.parentId,
      body: blogComments.body,
      status: blogComments.status,
      createdAt: sql<string>`to_char(${blogComments.createdAt} at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')`,
      reports,
      replies,
      postId: blogPosts.id,
      postTitle: blogPosts.title,
      postSlug: blogPosts.slug,
      userId: readerUser.id,
      name: readerUser.name,
      image: readerUser.image,
      banned: readerUser.banned,
      isAuthor: readerUser.isAuthor,
      provider,
    })
    .from(blogComments)
    .innerJoin(blogPosts, eq(blogComments.postId, blogPosts.id))
    .leftJoin(readerUser, eq(blogComments.userId, readerUser.id))
    .where(
      and(
        filter === "hidden" ? eq(blogComments.status, "hidden") : undefined,
        filter === "reported" ? sql`${reports} > 0` : undefined,
      ),
    )
    .orderBy(desc(blogComments.id))
    .limit(LIMIT);

  return rows.map((row) => ({
    id: row.id,
    parentId: row.parentId,
    body: row.body,
    status: row.status === "hidden" ? "hidden" : "visible",
    createdAt: row.createdAt,
    reports: row.reports,
    replies: row.replies,
    post: { id: row.postId, title: row.postTitle, slug: row.postSlug },
    reader: row.userId
      ? {
          id: row.userId,
          name: row.name ?? "",
          image: row.image,
          provider: row.provider,
          banned: Boolean(row.banned),
          isAuthor: Boolean(row.isAuthor),
        }
      : null,
  }));
}

export async function setCommentStatus(
  db: Database,
  id: number,
  status: "visible" | "hidden",
): Promise<boolean> {
  const updated = await db
    .update(blogComments)
    .set({ status })
    .where(eq(blogComments.id, id))
    .returning({ id: blogComments.id });
  return updated.length > 0;
}

// Deleting a comment takes its replies with it (the foreign key).
export async function deleteComment(
  db: Database,
  id: number,
): Promise<boolean> {
  const deleted = await db
    .delete(blogComments)
    .where(eq(blogComments.id, id))
    .returning({ id: blogComments.id });
  return deleted.length > 0;
}

export async function updateReader(
  db: Database,
  id: string,
  change: { banned?: boolean; isAuthor?: boolean },
): Promise<boolean> {
  if (Object.keys(change).length === 0) return false;
  const updated = await db
    .update(readerUser)
    .set(change)
    .where(eq(readerUser.id, id))
    .returning({ id: readerUser.id });
  return updated.length > 0;
}
