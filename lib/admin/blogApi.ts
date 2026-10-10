import { desc, eq, sql } from "drizzle-orm";
import * as schema from "@/db/schema";
import { findProblems } from "@/lib/blog/markdown";
import type { Database } from "@/lib/db";
import type { Failure } from "./api";
import { blogPostSchema, fieldErrors } from "./schemas";

// The blog admin API's logic (content-schema.md §4, design.md §14.19), apart from
// HTTP, as lib/admin/api.ts is for the rest of the admin. Posts have no manual
// order (newest first), a draft/published status, and rules for publishing.

const { blogPosts } = schema;

export type BlogPost = typeof blogPosts.$inferSelect;

export type BlogPostSummary = {
  id: number;
  title: string;
  slug: string;
  status: "draft" | "published";
  publishedAt: string | null;
  updatedAt: string;
  likeCount: number;
  commentCount: number;
  /** "live": French published; "draft": French text waiting; "none". */
  french: "live" | "draft" | "none";
};

const invalid = (fields: Record<string, string>): Failure => ({
  ok: false,
  status: 422,
  error: "invalid",
  fields,
});

const notFound: Failure = { ok: false, status: 404, error: "not-found" };

function uniqueViolation(error: unknown): Failure | null {
  const code = (e: unknown) =>
    typeof e === "object" && e !== null && "code" in e
      ? String((e as { code: unknown }).code)
      : "";
  const cause = (error as { cause?: unknown } | null)?.cause;
  if (code(error) !== "23505" && code(cause) !== "23505") return null;
  return invalid({ slug: "Another post already uses that address." });
}

// A post can only go live when it is whole: a description, and blocks that can
// be read (an image without alt text, a quiz without a right answer…).
//
// The French version, when it is switched on, is held to the same rule for its text: it
// needs its own body, and that body's blocks must be readable (docs/i18n.md §5).
export function publishProblems(post: {
  description: string;
  content: string;
  translations?: { fr?: Record<string, unknown> } | null;
}): Record<string, string> {
  const fields: Record<string, string> = {};
  if (!post.description.trim())
    fields.description = "Add a description before publishing.";
  const first = findProblems(post.content).find(
    (problem) => problem.level === "error",
  );
  if (first) fields.content = first.message;

  const fr = post.translations?.fr;
  if (fr?.published === true) {
    const french = typeof fr.content === "string" ? fr.content : "";
    if (!french.trim())
      fields["fr:content"] = "Add the French text before publishing it.";
    else {
      const problem = findProblems(french).find(
        (item) => item.level === "error",
      );
      if (problem) fields["fr:content"] = problem.message;
    }
  }
  return fields;
}

export async function listPosts(db: Database): Promise<BlogPostSummary[]> {
  const rows = await db
    .select({
      id: blogPosts.id,
      title: blogPosts.title,
      slug: blogPosts.slug,
      status: blogPosts.status,
      publishedAt: sql<
        string | null
      >`to_char(${blogPosts.publishedAt} at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')`,
      updatedAt: sql<string>`to_char(${blogPosts.updatedAt} at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')`,
      likeCount: blogPosts.likeCount,
      commentCount: sql<number>`(select count(*)::int from blog_comments c where c.post_id = blog_posts.id and c.status = 'visible')`,
      french: sql<
        "live" | "draft" | "none"
      >`case when btrim(coalesce(${blogPosts.translations} -> 'fr' ->> 'content', '')) = '' then 'none' when ${blogPosts.translations} -> 'fr' ->> 'published' = 'true' then 'live' else 'draft' end`,
    })
    .from(blogPosts)
    .orderBy(
      desc(sql`coalesce(${blogPosts.publishedAt}, ${blogPosts.updatedAt})`),
      desc(blogPosts.id),
    );
  return rows as BlogPostSummary[];
}

export async function getPost(
  db: Database,
  id: number,
): Promise<BlogPost | null> {
  const [row] = await db
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.id, id))
    .limit(1);
  return row ?? null;
}

const DEFAULTS = {
  description: "",
  content: "",
  tags: [] as string[],
  status: "draft",
  commentsEnabled: true,
};

export async function createPost(
  db: Database,
  input: unknown,
): Promise<{ ok: true; post: BlogPost } | Failure> {
  const body =
    typeof input === "object" && input !== null
      ? { ...DEFAULTS, ...input }
      : input;
  const parsed = blogPostSchema.safeParse(body);
  if (!parsed.success) return invalid(fieldErrors(parsed.error));
  const data = parsed.data;

  if (data.status === "published") {
    const problems = publishProblems(data);
    if (Object.keys(problems).length) return invalid(problems);
  }

  try {
    const [post] = await db
      .insert(blogPosts)
      .values({
        ...data,
        publishedAt: data.publishedAt
          ? new Date(data.publishedAt)
          : data.status === "published"
            ? new Date()
            : null,
      })
      .returning();
    return { ok: true, post };
  } catch (error) {
    const clash = uniqueViolation(error);
    if (clash) return clash;
    throw error;
  }
}

export async function updatePost(
  db: Database,
  id: number,
  input: unknown,
): Promise<{ ok: true; post: BlogPost } | Failure> {
  const parsed = blogPostSchema.partial().safeParse(input);
  if (!parsed.success) return invalid(fieldErrors(parsed.error));
  if (Object.keys(parsed.data).length === 0)
    return invalid({ _: "Nothing to change." });

  const existing = await getPost(db, id);
  if (!existing) return notFound;
  const merged = { ...existing, ...parsed.data };

  if (merged.status === "published") {
    const problems = publishProblems(merged);
    if (Object.keys(problems).length) return invalid(problems);
  }

  const { publishedAt, ...rest } = parsed.data;
  const changes: Partial<typeof blogPosts.$inferInsert> = { ...rest };
  if (publishedAt !== undefined)
    changes.publishedAt = publishedAt ? new Date(publishedAt) : null;
  // Going live for the first time stamps the date; unpublishing keeps it, so a
  // post that comes back keeps its place.
  if (merged.status === "published" && !merged.publishedAt) {
    changes.publishedAt = new Date();
  }

  try {
    const [post] = await db
      .update(blogPosts)
      .set(changes)
      .where(eq(blogPosts.id, id))
      .returning();
    return post ? { ok: true, post } : notFound;
  } catch (error) {
    const clash = uniqueViolation(error);
    if (clash) return clash;
    throw error;
  }
}

export async function deletePost(
  db: Database,
  id: number,
): Promise<{ ok: true } | Failure> {
  const deleted = await db
    .delete(blogPosts)
    .where(eq(blogPosts.id, id))
    .returning({ id: blogPosts.id });
  return deleted.length > 0 ? { ok: true } : notFound;
}

// A copy is always a draft: "Copy of …", its own address, no counts, and no
// link to a DEV article.
export async function duplicatePost(
  db: Database,
  id: number,
): Promise<{ ok: true; post: BlogPost } | Failure> {
  const source = await getPost(db, id);
  if (!source) return notFound;
  const base = `${source.slug}-copy`.slice(0, 74);
  for (let n = 1; n <= 50; n++) {
    const slug = n === 1 ? base : `${base}-${n}`;
    const created = await createPost(db, {
      title: `Copy of ${source.title}`.slice(0, 120),
      slug,
      description: source.description,
      content: source.content,
      coverUrl: source.coverUrl,
      coverAlt: source.coverAlt,
      tags: source.tags,
      commentsEnabled: source.commentsEnabled,
      canonicalUrl: null,
      series: source.series,
      // The French text comes along, switched off like the draft itself.
      translations: source.translations.fr
        ? { fr: { ...source.translations.fr, published: false } }
        : {},
      status: "draft",
    });
    if (created.ok || created.status !== 422 || !created.fields.slug)
      return created;
  }
  return invalid({ slug: "Couldn't find a free address for the copy." });
}
