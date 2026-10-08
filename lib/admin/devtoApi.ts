import { eq, inArray, isNotNull } from "drizzle-orm";
import * as schema from "@/db/schema";
import {
  DevError,
  devTags,
  getArticle,
  listArticles,
  publishArticle,
  type ArticleSummary,
  type Fetcher,
} from "@/lib/blog/devto";
import { markdownForDev } from "@/lib/blog/devtoExport";
import { articleToPost } from "@/lib/blog/devtoImport";
import type { Database } from "@/lib/db";
import { slugify } from "./order";
import { createPost } from "./blogApi";

// DEV import and export, apart from HTTP (design.md §13.49, docs/blog-markdown.md
// §3–§4). The DEV client takes `fetch` as a parameter, so tests stand in for DEV.

const { blogPosts } = schema;

export type FoundArticle = ArticleSummary & { imported: boolean };

export async function findArticles(
  db: Database,
  fetcher: Fetcher,
  username: string,
): Promise<FoundArticle[]> {
  const articles = await listArticles(fetcher, username);
  const known = new Set(
    (
      await db
        .select({ id: blogPosts.devtoId })
        .from(blogPosts)
        .where(isNotNull(blogPosts.devtoId))
    ).map((row) => row.id),
  );
  return articles.map((article) => ({
    ...article,
    imported: known.has(article.id),
  }));
}

export type ImportReport = {
  devId: number;
  title: string;
  status: "imported" | "skipped" | "failed";
  postId?: number;
  warnings: string[];
  notes: string[];
  error?: string;
};

const OPTIONAL = ["coverUrl", "canonicalUrl", "series"] as const;

async function importOne(
  db: Database,
  fetcher: Fetcher,
  devId: number,
): Promise<ImportReport> {
  const [already] = await db
    .select({ id: blogPosts.id })
    .from(blogPosts)
    .where(eq(blogPosts.devtoId, devId))
    .limit(1);
  if (already)
    return {
      devId,
      title: "",
      status: "skipped",
      postId: already.id,
      warnings: [],
      notes: ["This article was imported before."],
    };

  let post;
  try {
    post = articleToPost(await getArticle(fetcher, devId));
  } catch (error) {
    return {
      devId,
      title: "",
      status: "failed",
      warnings: [],
      notes: [],
      error:
        error instanceof DevError
          ? error.message
          : "Couldn't read that article.",
    };
  }

  const warnings = [...post.warnings];
  const base = slugify(post.title) || "post";
  const fields: Record<string, unknown> = {
    title: post.title,
    description: post.description,
    content: post.content,
    tags: post.tags,
    coverUrl: post.coverUrl,
    series: post.series,
    canonicalUrl: post.canonicalUrl,
    publishedAt: post.publishedAt,
    status: "draft",
  };

  for (let attempt = 0; attempt < 60; attempt++) {
    const slug = attempt === 0 ? base : `${base.slice(0, 70)}-${attempt + 1}`;
    const created = await createPost(db, { ...fields, slug });
    if (created.ok) {
      await db
        .update(blogPosts)
        .set({ devtoId: post.devtoId, devtoUrl: post.devtoUrl })
        .where(eq(blogPosts.id, created.post.id));
      return {
        devId,
        title: post.title,
        status: "imported",
        postId: created.post.id,
        warnings,
        notes: post.notes,
      };
    }
    if (created.status !== 422) break;
    if (created.fields.slug) continue;
    // A field the blog won't take (a cover address it can't use…) is dropped, with a warning.
    const bad = OPTIONAL.filter((key) => created.fields[key]);
    if (bad.length === 0) {
      return {
        devId,
        title: post.title,
        status: "failed",
        warnings,
        notes: [],
        error: Object.values(created.fields)[0],
      };
    }
    for (const key of bad) {
      fields[key] = null;
      warnings.push(
        `The ${key === "coverUrl" ? "cover image" : key === "canonicalUrl" ? "canonical address" : "series"} couldn't be used (${created.fields[key]}) and was left empty.`,
      );
    }
    attempt--;
  }
  return {
    devId,
    title: post.title,
    status: "failed",
    warnings,
    notes: [],
    error: "Couldn't save the draft.",
  };
}

// Each chosen article becomes a draft; nothing is published.
export async function importArticles(
  db: Database,
  fetcher: Fetcher,
  ids: readonly number[],
): Promise<ImportReport[]> {
  const unique = [...new Set(ids)].slice(0, 100);
  const reports: ImportReport[] = [];
  for (const id of unique) reports.push(await importOne(db, fetcher, id));
  // Fill in the titles of the ones skipped as already imported.
  const skipped = reports.filter((r) => r.status === "skipped" && r.postId);
  if (skipped.length) {
    const rows = await db
      .select({ id: blogPosts.id, title: blogPosts.title })
      .from(blogPosts)
      .where(
        inArray(
          blogPosts.id,
          skipped.map((r) => r.postId!),
        ),
      );
    for (const report of skipped)
      report.title = rows.find((row) => row.id === report.postId)?.title ?? "";
  }
  return reports;
}

export type ExportResult =
  | { ok: true; url: string; created: boolean; devId: number }
  | { ok: false; status: 404 | 409 | 502 | 400; error: string };

// Sends a saved post to DEV: created the first time, updated after that.
export async function exportPost(
  db: Database,
  fetcher: Fetcher,
  key: string | null,
  id: number,
  options: {
    publish: boolean;
    /** Ignore the article this post was linked to and create a new one. */
    fresh?: boolean;
    postUrl: (slug: string) => string;
  },
): Promise<ExportResult> {
  if (!key)
    return {
      ok: false,
      status: 400,
      error: "The DEV API key isn't set on the server.",
    };
  const [post] = await db
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.id, id))
    .limit(1);
  if (!post)
    return { ok: false, status: 404, error: "That post doesn't exist." };
  if (!post.title.trim() || !post.content.trim())
    return {
      ok: false,
      status: 400,
      error: "Write a title and some text before sending it to DEV.",
    };

  const postUrl = options.postUrl(post.slug);
  try {
    const sent = await publishArticle(
      fetcher,
      key,
      {
        title: post.title,
        body_markdown: markdownForDev(post.content, postUrl),
        published: options.publish,
        tags: devTags(post.tags),
        ...(post.description ? { description: post.description } : {}),
        canonical_url: postUrl,
        ...(post.coverUrl && /^https?:\/\//i.test(post.coverUrl)
          ? { main_image: post.coverUrl }
          : {}),
        ...(post.series ? { series: post.series } : {}),
      },
      options.fresh ? null : post.devtoId,
    );
    await db
      .update(blogPosts)
      .set({ devtoId: sent.id, devtoUrl: sent.url })
      .where(eq(blogPosts.id, id));
    return {
      ok: true,
      url: sent.url,
      created: options.fresh || !post.devtoId,
      devId: sent.id,
    };
  } catch (error) {
    if (error instanceof DevError)
      return {
        ok: false,
        status: error.status === 404 ? 409 : 502,
        error:
          error.status === 404
            ? "DEV no longer has the article this post was linked to."
            : error.message,
      };
    throw error;
  }
}
