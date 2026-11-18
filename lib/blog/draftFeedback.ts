import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import * as schema from "@/db/schema";
import { isShareToken } from "@/lib/admin/shareApi";
import type { Database } from "@/lib/db";
import type { Lang } from "@/lib/i18n";
import {
  feedbackErrors,
  type FeedbackFieldError,
} from "./feedbackText";

export {
  DEFAULT_FEEDBACK_MAX_WORDS,
  FEEDBACK_NAME_MAX,
  feedbackErrors,
  feedbackMaxWords,
  type FeedbackFieldError,
} from "./feedbackText";

// Private feedback on a shared draft (D93, design.md §13.69, §13.71,
// content-schema.md §4): sent by anyone holding the link, with a name and plain text,
// read only by the owner in the editor.

const { blogDraftFeedback, blogPosts } = schema;

export type Feedback = {
  id: number;
  name: string;
  body: string;
  lang: Lang;
  /** ISO time it was sent. */
  createdAt: string;
  /** ISO time the owner marked it read, or null. */
  readAt: string | null;
};

const iso = (
  column: typeof blogDraftFeedback.createdAt | typeof blogDraftFeedback.readAt,
) =>
  sql<string>`to_char(${column} at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`;

const columns = {
  id: blogDraftFeedback.id,
  name: blogDraftFeedback.name,
  body: blogDraftFeedback.body,
  lang: blogDraftFeedback.lang,
  createdAt: iso(blogDraftFeedback.createdAt),
  readAt: iso(blogDraftFeedback.readAt),
};

export type AddFeedbackResult =
  | { ok: true; feedback: Feedback; post: { id: number; title: string } }
  /** The link is unknown or off, or the post is published: nothing is stored. */
  | { ok: false; status: 404; error: "not-shared" }
  | {
      ok: false;
      status: 422;
      error: "invalid";
      fields: Partial<Record<"name" | "body", FeedbackFieldError>>;
    };

/** Stores feedback sent through a share link, if the link still opens a draft. */
export async function addFeedback(
  db: Database,
  input: { token: string; name: string; body: string; lang: Lang },
  options: { maxWords: number },
): Promise<AddFeedbackResult> {
  if (!isShareToken(input.token))
    return { ok: false, status: 404, error: "not-shared" };
  const fields = feedbackErrors(input, options.maxWords);
  if (Object.keys(fields).length)
    return { ok: false, status: 422, error: "invalid", fields };

  const [post] = await db
    .select({ id: blogPosts.id, title: blogPosts.title })
    .from(blogPosts)
    .where(
      and(
        eq(blogPosts.shareToken, input.token),
        eq(blogPosts.status, "draft"),
      ),
    )
    .limit(1);
  if (!post) return { ok: false, status: 404, error: "not-shared" };

  const [row] = await db
    .insert(blogDraftFeedback)
    .values({
      postId: post.id,
      name: input.name.trim(),
      body: input.body.trim(),
      lang: input.lang,
    })
    .returning(columns);
  return { ok: true, feedback: row as Feedback, post };
}

/** A post's feedback, newest first. */
export async function listFeedback(
  db: Database,
  postId: number,
): Promise<Feedback[]> {
  const rows = await db
    .select(columns)
    .from(blogDraftFeedback)
    .where(eq(blogDraftFeedback.postId, postId))
    .orderBy(desc(blogDraftFeedback.createdAt), desc(blogDraftFeedback.id));
  return rows as Feedback[];
}

/** Marks the given items (or, with `"all"`, every unread one) of a post read. */
export async function markFeedbackRead(
  db: Database,
  postId: number,
  ids: number[] | "all",
): Promise<number> {
  if (ids !== "all" && ids.length === 0) return 0;
  const updated = await db
    .update(blogDraftFeedback)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(blogDraftFeedback.postId, postId),
        isNull(blogDraftFeedback.readAt),
        ids === "all" ? undefined : inArray(blogDraftFeedback.id, ids),
      ),
    )
    .returning({ id: blogDraftFeedback.id });
  return updated.length;
}

/** Deletes one item of a post's feedback; false when there was none. */
export async function deleteFeedback(
  db: Database,
  postId: number,
  id: number,
): Promise<boolean> {
  const deleted = await db
    .delete(blogDraftFeedback)
    .where(
      and(eq(blogDraftFeedback.postId, postId), eq(blogDraftFeedback.id, id)),
    )
    .returning({ id: blogDraftFeedback.id });
  return deleted.length > 0;
}
