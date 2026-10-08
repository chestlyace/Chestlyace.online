import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import * as schema from "@/db/schema";
import { seed } from "@/db/seed";
import type { Database } from "@/lib/db";
import {
  getLikeState,
  hashVisitor,
  isVisitorToken,
  newVisitorToken,
  toggleLike,
} from "./likes";

let db: Database;
beforeEach(async () => {
  const fresh = drizzle(new PGlite(), { schema });
  await migrate(fresh, { migrationsFolder: "db/migrations" });
  db = fresh;
  await seed(db);
}, 30_000);

const SLUG = "hello-world";

describe("visitor tokens", () => {
  it("are random, recognised, and only their hash is kept", () => {
    const a = newVisitorToken();
    expect(isVisitorToken(a)).toBe(true);
    expect(newVisitorToken()).not.toBe(a);
    expect(isVisitorToken("short")).toBe(false);
    expect(isVisitorToken("has spaces and is long enough to pass length")).toBe(
      false,
    );
    expect(hashVisitor(a)).toMatch(/^[0-9a-f]{64}$/);
    expect(hashVisitor(a)).not.toContain(a);
  });
});

describe("likes", () => {
  it("starts at nothing, likes, shows as liked, and takes the like back", async () => {
    const me = hashVisitor(newVisitorToken());
    expect(await getLikeState(db, SLUG, me)).toEqual({
      count: 0,
      liked: false,
    });
    expect(await toggleLike(db, SLUG, me)).toEqual({ count: 1, liked: true });
    expect(await getLikeState(db, SLUG, me)).toEqual({ count: 1, liked: true });
    expect(await getLikeState(db, SLUG, null)).toEqual({
      count: 1,
      liked: false,
    });
    expect(await toggleLike(db, SLUG, me)).toEqual({ count: 0, liked: false });
  });

  it("counts each browser once and keeps the post's like count in step", async () => {
    const a = hashVisitor(newVisitorToken());
    const b = hashVisitor(newVisitorToken());
    await toggleLike(db, SLUG, a);
    await toggleLike(db, SLUG, b);
    expect((await getLikeState(db, SLUG, a))?.count).toBe(2);
    const rows = await db.select().from(schema.blogLikes);
    expect(rows).toHaveLength(2);
    const [post] = await db
      .select()
      .from(schema.blogPosts)
      .where(eq(schema.blogPosts.slug, SLUG));
    expect(post.likeCount).toBe(2);
    // the table holds hashes, never the token
    expect(rows.every((row) => /^[0-9a-f]{64}$/.test(row.visitorHash))).toBe(
      true,
    );
  });

  it("never goes below zero, and only a published post can be liked", async () => {
    await db
      .update(schema.blogPosts)
      .set({ likeCount: 0 })
      .where(eq(schema.blogPosts.slug, SLUG));
    const me = hashVisitor(newVisitorToken());
    await toggleLike(db, SLUG, me);
    await db
      .update(schema.blogPosts)
      .set({ likeCount: 0 })
      .where(eq(schema.blogPosts.slug, SLUG));
    expect((await toggleLike(db, SLUG, me))?.count).toBe(0);
    expect(await toggleLike(db, "nope", me)).toBeNull();
    await db
      .update(schema.blogPosts)
      .set({ status: "draft" })
      .where(eq(schema.blogPosts.slug, SLUG));
    expect(await toggleLike(db, SLUG, me)).toBeNull();
    expect(await getLikeState(db, SLUG, me)).toBeNull();
  });

  it("are removed with the post", async () => {
    await toggleLike(db, SLUG, hashVisitor(newVisitorToken()));
    await db.delete(schema.blogPosts).where(eq(schema.blogPosts.slug, SLUG));
    expect(await db.select().from(schema.blogLikes)).toHaveLength(0);
  });
});
