import { PGlite } from "@electric-sql/pglite";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import * as schema from "@/db/schema";
import type { Database } from "@/lib/db";
import { createPost, listPosts, updatePost } from "./blogApi";
import {
  getShare,
  isShareToken,
  newShareToken,
  sharePost,
  unsharePost,
} from "./shareApi";

let db: Database;
beforeAll(async () => {
  const fresh = drizzle(new PGlite(), { schema });
  await migrate(fresh, { migrationsFolder: "db/migrations" });
  db = fresh;
}, 30_000);

beforeEach(async () => {
  await db.delete(schema.blogPosts);
});

async function draft(slug = "a-post") {
  const result = await createPost(db, {
    title: "A post",
    slug,
    description: "About it",
    content: "Some words.",
  });
  if (!result.ok) throw new Error(JSON.stringify(result));
  return result.post;
}

const updatedAt = async (id: number) =>
  (
    await db
      .select({ at: schema.blogPosts.updatedAt })
      .from(schema.blogPosts)
      .where(eq(schema.blogPosts.id, id))
  )[0].at.toISOString();

describe("share tokens", () => {
  it("are 43 base64url characters, different each time", () => {
    const a = newShareToken();
    expect(a).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(isShareToken(a)).toBe(true);
    expect(newShareToken()).not.toBe(a);
  });

  it.each(["", "short", "x".repeat(44), `${"a".repeat(42)}/`])(
    "refuses %j",
    (value) => {
      expect(isShareToken(value)).toBe(false);
    },
  );
});

describe("sharePost", () => {
  it("makes a link for a draft, and returns the same one next time", async () => {
    const post = await draft();
    const first = await sharePost(db, post.id);
    if (!first.ok) throw new Error(JSON.stringify(first));
    expect(isShareToken(first.share.token)).toBe(true);
    expect(Date.parse(first.share.createdAt)).not.toBeNaN();

    expect(await sharePost(db, post.id)).toEqual(first);
    expect(await getShare(db, post.id)).toEqual(first);
  });

  it("renews: a new token replaces the old one", async () => {
    const post = await draft();
    const first = await sharePost(db, post.id);
    const renewed = await sharePost(db, post.id, { renew: true });
    if (!first.ok || !renewed.ok) throw new Error("share failed");
    expect(renewed.share.token).not.toBe(first.share.token);
    expect(await getShare(db, post.id)).toEqual(renewed);
  });

  it("refuses a published post", async () => {
    const post = await draft();
    await updatePost(db, post.id, { status: "published" });
    expect(await sharePost(db, post.id)).toMatchObject({
      ok: false,
      status: 422,
      fields: { _: expect.stringContaining("Only a draft") },
    });
  });

  it("answers 404 for a post that doesn't exist", async () => {
    expect(await sharePost(db, 999)).toMatchObject({ status: 404 });
    expect(await unsharePost(db, 999)).toMatchObject({ status: 404 });
    expect(await getShare(db, 999)).toMatchObject({ status: 404 });
  });

  it("is not an edit: the post's updated_at stays", async () => {
    const post = await draft();
    const before = await updatedAt(post.id);
    await new Promise((resolve) => setTimeout(resolve, 5));
    await sharePost(db, post.id);
    await sharePost(db, post.id, { renew: true });
    await unsharePost(db, post.id);
    expect(await updatedAt(post.id)).toBe(before);

    // A real edit still moves it.
    await updatePost(db, post.id, { title: "Changed" });
    expect(await updatedAt(post.id)).not.toBe(before);
  });
});

describe("unsharePost", () => {
  it("turns the link off", async () => {
    const post = await draft();
    await sharePost(db, post.id);
    expect(await unsharePost(db, post.id)).toEqual({ ok: true, share: null });
    expect(await getShare(db, post.id)).toEqual({ ok: true, share: null });
  });

  it("works on a published post too", async () => {
    const post = await draft();
    await sharePost(db, post.id);
    await updatePost(db, post.id, { status: "published" });
    expect(await unsharePost(db, post.id)).toEqual({ ok: true, share: null });
  });
});

describe("listPosts", () => {
  it("marks the shared posts", async () => {
    const a = await draft("a");
    await draft("b");
    await sharePost(db, a.id);
    const rows = await listPosts(db);
    expect(
      Object.fromEntries(rows.map((row) => [row.slug, row.shared])),
    ).toEqual({ a: true, b: false });
  });
});
