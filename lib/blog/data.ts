import {
  and,
  arrayContains,
  desc,
  eq,
  isNotNull,
  sql,
  type SQL,
} from "drizzle-orm";
import * as schema from "@/db/schema";
import type { Database } from "@/lib/db";
import {
  toCopy,
  withDefaults,
  type NewsletterCopy,
} from "@/lib/newsletterCopy";
import type { Lang } from "@/lib/i18n";
import { inLanguage, writtenIn, type FrenchColumns } from "./localizePost";
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

const minutesOf = (text: SQL) =>
  sql<number>`greatest(1, ceil(cardinality(regexp_split_to_array(btrim(${text}), '\\s+'))::numeric / 200))::int`;

const readingMinutes = minutesOf(sql`${blogPosts.content}`);

// The French version lives in `translations.fr` (docs/i18n.md §5).
const frenchContent = sql<
  string | null
>`${blogPosts.translations} -> 'fr' ->> 'content'`;

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
  fr: sql<Record<
    string,
    unknown
  > | null>`(${blogPosts.translations} -> 'fr') - 'content'`,
  frenchLive: sql<boolean>`coalesce(btrim(${frenchContent}) <> '' and ${blogPosts.translations} -> 'fr' ->> 'published' = 'true', false)`,
  readingMinutesFr: minutesOf(sql`${frenchContent}`),
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
  /** The language the text is in: French only for a post with a published French version. */
  lang: Lang;
  /** Whether the post has a published French version (the alternates need it). */
  hasFrench: boolean;
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
type SummaryRow = Omit<PostSummary, "lang"> & FrenchColumns;

/**
 * Every published post, newest first, as `lang` reads it. On the French blog every post
 * is listed: one without a published French version is in English (`lang: "en"`).
 */
export async function listPublishedPosts(
  db: Database,
  lang: Lang = "en",
): Promise<PostSummary[]> {
  const rows = (await db
    .select(summaryColumns)
    .from(blogPosts)
    .where(published)
    .orderBy(...newestFirst)) as SummaryRow[];
  return rows.map((row) => inLanguage(row, lang));
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

export async function getPublishedPost(
  db: Database,
  slug: string,
  lang: Lang = "en",
): Promise<PostPage | null> {
  const [row] = await db
    .select({
      ...summaryColumns,
      content: blogPosts.content,
      frenchContent,
      canonicalUrl: blogPosts.canonicalUrl,
      commentsEnabled: blogPosts.commentsEnabled,
      likeCount: blogPosts.likeCount,
      series: blogPosts.series,
    })
    .from(blogPosts)
    .where(and(published, eq(blogPosts.slug, slug)))
    .limit(1);
  if (!row) return null;

  const { frenchContent: french, ...rest } = row;
  const localized = inLanguage(rest as typeof rest & FrenchColumns, lang);
  const inFrench = localized.lang === "fr";
  const all = await listPublishedPosts(db, lang);
  const index = all.findIndex((post) => post.slug === slug);
  return {
    post: {
      ...localized,
      content: inFrench && french ? french : rest.content,
      // The cross-post canonical belongs to the English text.
      canonicalUrl: inFrench ? null : rest.canonicalUrl,
    } as Post,
    previous: all[index + 1] ?? null,
    next: index > 0 ? all[index - 1] : null,
  };
}

export type TagCount = { tag: string; count: number };

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

/** The tags and their counts; the French blog counts only the posts with French. */
export async function listTags(
  db: Database,
  lang: Lang = "en",
): Promise<TagCount[]> {
  return countTags(writtenIn(await listPublishedPosts(db, lang), lang));
}

/** The posts with a tag; the French blog lists only the posts with French. */
export async function listPostsByTag(
  db: Database,
  tag: string,
  lang: Lang = "en",
): Promise<PostSummary[]> {
  return writtenIn(await listPublishedPosts(db, lang), lang).filter((post) =>
    post.tags.includes(tag),
  );
}

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
export async function getNewsletterCopy(
  db: Database,
  lang: Lang = "en",
): Promise<NewsletterCopy> {
  const [row] = await db
    .select()
    .from(schema.newsletterSettings)
    .where(eq(schema.newsletterSettings.id, 1));
  return toCopy(withDefaults(row, lang));
}
