import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import * as schema from "@/db/schema";
import type { Database } from "@/lib/db";
import type { Failure } from "./api";

// A draft's share link (D93, content-schema.md §4, design.md §13.70), apart from
// HTTP. One link per post: turning sharing on returns the link there is or makes
// one, "renew" replaces it, turning it off clears it. Only a draft can get a link;
// a published post keeps the one it has (its link answers 307 to the post).

const { blogPosts } = schema;

export type ShareLink = {
  token: string;
  /** ISO time the current link was made. */
  createdAt: string;
};

const notFound: Failure = { ok: false, status: 404, error: "not-found" };

/** 32 random bytes, base64url: 43 characters. */
export function newShareToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Whether a string could be a share token, before asking the database. */
export function isShareToken(value: string): boolean {
  return /^[A-Za-z0-9_-]{43}$/.test(value);
}

function linkOf(row: {
  shareToken: string | null;
  shareCreatedAt: Date | null;
}): ShareLink | null {
  return row.shareToken && row.shareCreatedAt
    ? { token: row.shareToken, createdAt: row.shareCreatedAt.toISOString() }
    : null;
}

async function current(db: Database, id: number) {
  const [row] = await db
    .select({
      status: blogPosts.status,
      shareToken: blogPosts.shareToken,
      shareCreatedAt: blogPosts.shareCreatedAt,
    })
    .from(blogPosts)
    .where(eq(blogPosts.id, id))
    .limit(1);
  return row ?? null;
}

export async function getShare(
  db: Database,
  id: number,
): Promise<{ ok: true; share: ShareLink | null } | Failure> {
  const row = await current(db, id);
  return row ? { ok: true, share: linkOf(row) } : notFound;
}

export async function sharePost(
  db: Database,
  id: number,
  options: { renew?: boolean } = {},
): Promise<{ ok: true; share: ShareLink } | Failure> {
  const row = await current(db, id);
  if (!row) return notFound;
  if (row.status !== "draft")
    return {
      ok: false,
      status: 422,
      error: "invalid",
      fields: { _: "Only a draft can be shared. This post is published." },
    };
  const existing = linkOf(row);
  if (existing && !options.renew) return { ok: true, share: existing };

  const [updated] = await db
    .update(blogPosts)
    .set({ shareToken: newShareToken(), shareCreatedAt: new Date() })
    .where(eq(blogPosts.id, id))
    .returning({
      shareToken: blogPosts.shareToken,
      shareCreatedAt: blogPosts.shareCreatedAt,
    });
  const share = updated ? linkOf(updated) : null;
  return share ? { ok: true, share } : notFound;
}

export async function unsharePost(
  db: Database,
  id: number,
): Promise<{ ok: true; share: null } | Failure> {
  const updated = await db
    .update(blogPosts)
    .set({ shareToken: null, shareCreatedAt: null })
    .where(eq(blogPosts.id, id))
    .returning({ id: blogPosts.id });
  return updated.length ? { ok: true, share: null } : notFound;
}
