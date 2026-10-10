import { and, asc, desc, eq, inArray, isNull, lt, or, sql } from "drizzle-orm";
import * as schema from "@/db/schema";
import type { Database } from "@/lib/db";
import { DELETED_USER, countWords, normalise } from "./commentText";

// Comments under a post (design.md §13.37): plain text, one level of replies,
// visible at once and moderated afterwards. Reads and writes, apart from HTTP and
// from who is signed in (the routes pass the reader's id).
const {
  blogComments,
  blogCommentLikes,
  blogCommentReports,
  blogPosts,
  readerUser,
} = schema;

export const PAGE_SIZE = 20;

export type CommentView = {
  id: number;
  parentId: number | null;
  /** Empty for a comment that was removed but has replies. */
  body: string;
  removed: boolean;
  createdAt: string;
  likeCount: number;
  liked: boolean;
  mine: boolean;
  author: { name: string; image: string | null; isAuthor: boolean } | null;
  replies: CommentView[];
};

export type CommentPage = {
  items: CommentView[];
  total: number;
  nextCursor: number | null;
};

export type CommentFailure =
  | { ok: false; status: 404; error: "not-found" }
  | { ok: false; status: 403; error: "closed" }
  | {
      ok: false;
      status: 422;
      error: "invalid";
      /** What went wrong, for the page to say in its language. */
      code: InvalidCode;
      /** English text (what the page shows when it has no wording for the code). */
      message: string;
      values?: Record<string, number>;
    };

export type InvalidCode =
  | "empty"
  | "too-long"
  | "too-many-words"
  | "no-parent"
  | "duplicate"
  | "own-comment";

const invalid = (
  code: InvalidCode,
  message: string,
  values?: Record<string, number>,
): CommentFailure => ({
  ok: false,
  status: 422,
  error: "invalid",
  code,
  message,
  ...(values ? { values } : {}),
});
const notFound: CommentFailure = { ok: false, status: 404, error: "not-found" };

async function postBySlug(db: Database, slug: string) {
  const [post] = await db
    .select({ id: blogPosts.id, enabled: blogPosts.commentsEnabled })
    .from(blogPosts)
    .where(and(eq(blogPosts.slug, slug), eq(blogPosts.status, "published")))
    .limit(1);
  return post ?? null;
}

const columns = {
  id: blogComments.id,
  parentId: blogComments.parentId,
  body: blogComments.body,
  status: blogComments.status,
  likeCount: blogComments.likeCount,
  createdAt: sql<string>`to_char(${blogComments.createdAt} at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')`,
  userId: blogComments.userId,
  name: readerUser.name,
  image: readerUser.image,
  isAuthor: readerUser.isAuthor,
};

type Row = {
  id: number;
  parentId: number | null;
  body: string;
  status: string;
  likeCount: number;
  createdAt: string;
  userId: string | null;
  name: string | null;
  image: string | null;
  isAuthor: boolean | null;
};

function toView(
  row: Row,
  viewerId: string | null,
  liked: Set<number>,
  replies: CommentView[] = [],
): CommentView {
  const removed = row.status === "hidden";
  return {
    id: row.id,
    parentId: row.parentId,
    body: removed ? "" : row.body,
    removed,
    createdAt: row.createdAt,
    likeCount: removed ? 0 : row.likeCount,
    liked: liked.has(row.id),
    mine: viewerId !== null && row.userId === viewerId,
    author: removed
      ? null
      : {
          name: row.name ?? DELETED_USER,
          image: row.image,
          isAuthor: Boolean(row.isAuthor),
        },
    replies,
  };
}

// Newest first, 20 at a time. A removed comment shows only when it has replies
// (as a placeholder); replies come oldest first under their comment.
export async function listComments(
  db: Database,
  slug: string,
  options: { viewerId: string | null; cursor?: number | null },
): Promise<(CommentPage & { enabled: boolean }) | null> {
  const post = await postBySlug(db, slug);
  if (!post) return null;
  if (!post.enabled)
    return { items: [], total: 0, nextCursor: null, enabled: false };

  const [{ total }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(blogComments)
    .where(
      and(eq(blogComments.postId, post.id), eq(blogComments.status, "visible")),
    );

  const replied = db
    .select({ parent: blogComments.parentId })
    .from(blogComments)
    .where(
      and(eq(blogComments.postId, post.id), eq(blogComments.status, "visible")),
    );
  const top = await db
    .select(columns)
    .from(blogComments)
    .leftJoin(readerUser, eq(blogComments.userId, readerUser.id))
    .where(
      and(
        eq(blogComments.postId, post.id),
        isNull(blogComments.parentId),
        options.cursor ? lt(blogComments.id, options.cursor) : undefined,
        or(
          eq(blogComments.status, "visible"),
          inArray(blogComments.id, replied),
        ),
      ),
    )
    .orderBy(desc(blogComments.id))
    .limit(PAGE_SIZE + 1);
  const page = top.slice(0, PAGE_SIZE);
  const ids = page.map((row) => row.id);

  const replyRows = ids.length
    ? await db
        .select(columns)
        .from(blogComments)
        .leftJoin(readerUser, eq(blogComments.userId, readerUser.id))
        .where(
          and(
            inArray(blogComments.parentId, ids),
            eq(blogComments.status, "visible"),
          ),
        )
        .orderBy(asc(blogComments.id))
    : [];

  const allIds = [...ids, ...replyRows.map((row) => row.id)];
  const liked = new Set<number>();
  if (options.viewerId && allIds.length) {
    const rows = await db
      .select({ id: blogCommentLikes.commentId })
      .from(blogCommentLikes)
      .where(
        and(
          eq(blogCommentLikes.userId, options.viewerId),
          inArray(blogCommentLikes.commentId, allIds),
        ),
      );
    for (const row of rows) liked.add(row.id);
  }

  const items = page.map((row) =>
    toView(
      row,
      options.viewerId,
      liked,
      replyRows
        .filter((reply) => reply.parentId === row.id)
        .map((reply) => toView(reply, options.viewerId, liked)),
    ),
  );
  return {
    items,
    total,
    nextCursor: top.length > PAGE_SIZE ? page[page.length - 1].id : null,
    enabled: true,
  };
}

export async function createComment(
  db: Database,
  input: {
    slug: string;
    userId: string;
    body: string;
    parentId?: number | null;
  },
  options: { maxWords: number },
): Promise<
  { ok: true; comment: CommentView; postId: number } | CommentFailure
> {
  const post = await postBySlug(db, input.slug);
  if (!post) return notFound;
  if (!post.enabled) return { ok: false, status: 403, error: "closed" };

  const body = input.body
    .replace(/\r\n?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (!body) return invalid("empty", "Write something first.");
  if (body.length > 5000)
    return invalid("too-long", "That comment is too long.");
  const words = countWords(body);
  if (words > options.maxWords)
    return invalid(
      "too-many-words",
      `Keep it to ${options.maxWords} words or fewer (it is ${words}).`,
      { max: options.maxWords, words },
    );

  // A reply to a reply attaches to the same parent (one level deep).
  let parentId: number | null = null;
  if (input.parentId) {
    const [parent] = await db
      .select({
        id: blogComments.id,
        parentId: blogComments.parentId,
        postId: blogComments.postId,
        status: blogComments.status,
      })
      .from(blogComments)
      .where(eq(blogComments.id, input.parentId))
      .limit(1);
    if (!parent || parent.postId !== post.id || parent.status !== "visible")
      return invalid("no-parent", "That comment isn't there to reply to.");
    parentId = parent.parentId ?? parent.id;
  }

  // The same words twice, with nobody having answered the first, are refused.
  const mine = await db
    .select({ id: blogComments.id, body: blogComments.body })
    .from(blogComments)
    .where(
      and(
        eq(blogComments.postId, post.id),
        eq(blogComments.userId, input.userId),
      ),
    );
  const wanted = normalise(body);
  for (const earlier of mine.filter((row) => normalise(row.body) === wanted)) {
    const [answered] = await db
      .select({ id: blogComments.id })
      .from(blogComments)
      .where(
        and(
          eq(blogComments.parentId, earlier.id),
          eq(blogComments.status, "visible"),
        ),
      )
      .limit(1);
    if (!answered) return invalid("duplicate", "You've already posted that.");
  }

  const [row] = await db
    .insert(blogComments)
    .values({ postId: post.id, userId: input.userId, parentId, body })
    .returning({ id: blogComments.id });
  const [created] = await db
    .select(columns)
    .from(blogComments)
    .leftJoin(readerUser, eq(blogComments.userId, readerUser.id))
    .where(eq(blogComments.id, row.id));
  return {
    ok: true,
    comment: toView(created, input.userId, new Set()),
    postId: post.id,
  };
}

// A reader deletes their own comment. One with replies stays as "This comment was
// removed." so their replies keep their place; one without goes completely.
export async function deleteOwnComment(
  db: Database,
  id: number,
  userId: string,
): Promise<{ ok: true } | CommentFailure> {
  const [comment] = await db
    .select({ id: blogComments.id, userId: blogComments.userId })
    .from(blogComments)
    .where(eq(blogComments.id, id))
    .limit(1);
  if (!comment || comment.userId !== userId) return notFound;
  const [reply] = await db
    .select({ id: blogComments.id })
    .from(blogComments)
    .where(eq(blogComments.parentId, id))
    .limit(1);
  if (reply)
    await db
      .update(blogComments)
      .set({ status: "hidden" })
      .where(eq(blogComments.id, id));
  else await db.delete(blogComments).where(eq(blogComments.id, id));
  return { ok: true };
}

export async function toggleCommentLike(
  db: Database,
  id: number,
  userId: string,
): Promise<{ ok: true; count: number; liked: boolean } | CommentFailure> {
  const [comment] = await db
    .select({ id: blogComments.id })
    .from(blogComments)
    .where(and(eq(blogComments.id, id), eq(blogComments.status, "visible")))
    .limit(1);
  if (!comment) return notFound;

  return db.transaction(async (tx) => {
    const removed = await tx
      .delete(blogCommentLikes)
      .where(
        and(
          eq(blogCommentLikes.commentId, id),
          eq(blogCommentLikes.userId, userId),
        ),
      )
      .returning({ id: blogCommentLikes.commentId });
    let liked = false;
    if (removed.length === 0) {
      const added = await tx
        .insert(blogCommentLikes)
        .values({ commentId: id, userId })
        .onConflictDoNothing()
        .returning({ id: blogCommentLikes.commentId });
      liked = added.length > 0;
      if (!liked) {
        const [now] = await tx
          .select({ count: blogComments.likeCount })
          .from(blogComments)
          .where(eq(blogComments.id, id));
        return { ok: true as const, count: now.count, liked: true };
      }
    }
    const [updated] = await tx
      .update(blogComments)
      .set({
        likeCount: sql`greatest(${blogComments.likeCount} + ${liked ? 1 : -1}, 0)`,
      })
      .where(eq(blogComments.id, id))
      .returning({ count: blogComments.likeCount });
    return { ok: true as const, count: updated.count, liked };
  });
}

// One report per reader per comment; reporting again changes nothing.
export async function reportComment(
  db: Database,
  id: number,
  userId: string,
): Promise<{ ok: true } | CommentFailure> {
  const [comment] = await db
    .select({ id: blogComments.id, userId: blogComments.userId })
    .from(blogComments)
    .where(and(eq(blogComments.id, id), eq(blogComments.status, "visible")))
    .limit(1);
  if (!comment) return notFound;
  if (comment.userId === userId)
    return invalid("own-comment", "You can't report your own comment.");
  await db
    .insert(blogCommentReports)
    .values({ commentId: id, userId })
    .onConflictDoNothing();
  return { ok: true };
}

/** What the owner's email needs to say about a new comment. */
export async function commentContext(db: Database, postId: number) {
  const [post] = await db
    .select({ title: blogPosts.title, slug: blogPosts.slug })
    .from(blogPosts)
    .where(eq(blogPosts.id, postId))
    .limit(1);
  return post ?? null;
}
