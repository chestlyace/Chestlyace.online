import { and, arrayContains, desc, eq, isNotNull, sql } from "drizzle-orm";
import * as schema from "@/db/schema";
import type { Database } from "@/lib/db";
import {
  toCopy,
  withDefaults,
  type NewsletterCopy,
} from "@/lib/newsletterCopy";
import type { SessionTurn } from "./session/types";

// Public reads of the blog (docs/content-schema.md §4). Results are cached as
// JSON (lib/blog/cache.ts), so timestamps are selected as ISO strings rather
// than Dates, and reading time is worked out here, in SQL, from the markdown's
// words (200 a minute, at least one minute).
const { blogPosts } = schema;

const iso = (
  column: typeof blogPosts.publishedAt | typeof blogPosts.updatedAt,
) =>
  sql<string>`to_char(${column} at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')`;

const readingMinutes = sql<number>`greatest(1, ceil(cardinality(regexp_split_to_array(btrim(${blogPosts.content}), '\\s+'))::numeric / 200))::int`;

const summaryColumns = {
  slug: blogPosts.slug,
  title: blogPosts.title,
  description: blogPosts.description,
  coverUrl: blogPosts.coverUrl,
  coverAlt: blogPosts.coverAlt,
  tags: blogPosts.tags,
  publishedAt: iso(blogPosts.publishedAt),
  updatedAt: iso(blogPosts.updatedAt),
  readingMinutes,
};

export type PostSummary = {
  slug: string;
  title: string;
  description: string;
  coverUrl: string | null;
  coverAlt: string | null;
  tags: string[];
  publishedAt: string;
  updatedAt: string;
  readingMinutes: number;
};

export type Post = PostSummary & {
  content: string;
  canonicalUrl: string | null;
  commentsEnabled: boolean;
  likeCount: number;
  series: string | null;
};

const published = and(
  eq(blogPosts.status, "published"),
  isNotNull(blogPosts.publishedAt),
);

const newestFirst = [desc(blogPosts.publishedAt), desc(blogPosts.id)] as const;

// Every published post, newest first (no bodies).
export async function listPublishedPosts(db: Database): Promise<PostSummary[]> {
  return (await db
    .select(summaryColumns)
    .from(blogPosts)
    .where(published)
    .orderBy(...newestFirst)) as PostSummary[];
}

export async function listPublishedSlugs(db: Database): Promise<string[]> {
  return (await listPublishedPosts(db)).map((post) => post.slug);
}

export type PostPage = {
  post: Post;
  /** The next older post. */
  previous: PostSummary | null;
  /** The next newer post. */
  next: PostSummary | null;
};

// One published post with its neighbours; a draft or unknown slug is null.
export async function getPublishedPost(
  db: Database,
  slug: string,
): Promise<PostPage | null> {
  const [row] = await db
    .select({
      ...summaryColumns,
      content: blogPosts.content,
      canonicalUrl: blogPosts.canonicalUrl,
      commentsEnabled: blogPosts.commentsEnabled,
      likeCount: blogPosts.likeCount,
      series: blogPosts.series,
    })
    .from(blogPosts)
    .where(and(published, eq(blogPosts.slug, slug)))
    .limit(1);
  if (!row) return null;

  const all = await listPublishedPosts(db);
  const index = all.findIndex((post) => post.slug === slug);
  return {
    post: row as Post,
    previous: all[index + 1] ?? null,
    next: index > 0 ? all[index - 1] : null,
  };
}

export type TagCount = { tag: string; count: number };

// Tags with at least one published post: most posts first, then A to Z.
export function countTags(
  posts: readonly Pick<PostSummary, "tags">[],
): TagCount[] {
  const counts = new Map<string, number>();
  for (const post of posts)
    for (const tag of new Set(post.tags))
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
  return [...counts]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

export async function listTags(db: Database): Promise<TagCount[]> {
  return countTags(await listPublishedPosts(db));
}

export async function listPostsByTag(
  db: Database,
  tag: string,
): Promise<PostSummary[]> {
  return (await db
    .select(summaryColumns)
    .from(blogPosts)
    .where(and(published, arrayContains(blogPosts.tags, [tag])))
    .orderBy(...newestFirst)) as PostSummary[];
}

// The socials the blog's footer shows (`show_on` includes "blog").
export async function listBlogSocials(
  db: Database,
): Promise<{ platform: string; url: string }[]> {
  return db
    .select({ platform: schema.socials.platform, url: schema.socials.url })
    .from(schema.socials)
    .where(arrayContains(schema.socials.showOn, ["blog"]))
    .orderBy(schema.socials.orderIndex, schema.socials.id);
}

export type AgentSession = {
  id: string;
  title: string;
  turns: SessionTurn[];
};

// A stored agent session by id, for a post's `session` block (9b.6).
export async function getAgentSession(
  db: Database,
  id: string,
): Promise<AgentSession | null> {
  const [row] = await db
    .select({
      id: schema.agentSessions.id,
      title: schema.agentSessions.title,
      turns: schema.agentSessions.turns,
    })
    .from(schema.agentSessions)
    .where(eq(schema.agentSessions.id, id));
  return row ?? null;
}

// The newsletter's wording and switch for the box, the confirmation page and the
// email (9b.7): the stored row over the built-in wording.
export async function getNewsletterCopy(db: Database): Promise<NewsletterCopy> {
  const [row] = await db
    .select()
    .from(schema.newsletterSettings)
    .where(eq(schema.newsletterSettings.id, 1));
  return toCopy(withDefaults(row));
}
