import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import * as schema from "@/db/schema";
import { seed } from "@/db/seed";
import type { Database } from "@/lib/db";
import {
  deleteComment,
  listForModeration,
  setCommentStatus,
  updateReader,
} from "./commentsApi";
import { listPosts } from "./blogApi";

let db: Database;
let c1: number, c2: number, c3: number;

beforeEach(async () => {
  const fresh = drizzle(new PGlite(), { schema });
  await migrate(fresh, { migrationsFolder: "db/migrations" });
  db = fresh;
  await seed(db);
  await db.insert(schema.readerUser).values([
    { id: "u1", name: "Ada", email: "a@x.test", image: "https://i/a.png" },
    { id: "u2", name: "Bo", email: "b@x.test" },
  ]);
  await db.insert(schema.readerAccount).values([
    { id: "a1", accountId: "1", providerId: "github", userId: "u1" },
    { id: "a2", accountId: "2", providerId: "google", userId: "u2" },
  ]);
  const [post] = await db
    .select({ id: schema.blogPosts.id })
    .from(schema.blogPosts);
  const made = await db
    .insert(schema.blogComments)
    .values([
      { postId: post.id, userId: "u1", body: "First" },
      { postId: post.id, userId: "u2", body: "Second" },
      { postId: post.id, userId: null, body: "From a deleted account" },
    ])
    .returning({ id: schema.blogComments.id });
  [c1, c2, c3] = made.map((row) => row.id);
  await db
    .insert(schema.blogComments)
    .values({ postId: post.id, userId: "u2", parentId: c1, body: "A reply" });
  await db.insert(schema.blogCommentReports).values([
    { commentId: c2, userId: "u1" },
    { commentId: c3, userId: "u1" },
    { commentId: c3, userId: "u2" },
  ]);
}, 30_000);

describe("listForModeration", () => {
  it("lists newest first with the reader, provider, post and report count", async () => {
    const rows = await listForModeration(db, "all");
    expect(rows.map((r) => r.body)).toEqual([
      "A reply",
      "From a deleted account",
      "Second",
      "First",
    ]);
    const first = rows.find((r) => r.body === "First")!;
    expect(first).toMatchObject({
      replies: 1,
      reports: 0,
      status: "visible",
      post: { title: "Hello, world", slug: "hello-world" },
      reader: {
        name: "Ada",
        provider: "github",
        banned: false,
        isAuthor: false,
      },
    });
    expect(rows.find((r) => r.body === "Second")?.reader?.provider).toBe(
      "google",
    );
    expect(rows.find((r) => r.id === c3)).toMatchObject({
      reports: 2,
      reader: null,
    });
  });

  it("filters to reported and to hidden", async () => {
    expect(
      (await listForModeration(db, "reported")).map((r) => [r.id, r.reports]),
    ).toEqual([
      [c3, 2],
      [c2, 1],
    ]);
    await setCommentStatus(db, c1, "hidden");
    expect((await listForModeration(db, "hidden")).map((r) => r.id)).toEqual([
      c1,
    ]);
  });
});

describe("moderating", () => {
  it("hides and shows, and says when there is no such comment", async () => {
    expect(await setCommentStatus(db, c1, "hidden")).toBe(true);
    const [row] = await db
      .select()
      .from(schema.blogComments)
      .where(eq(schema.blogComments.id, c1));
    expect(row.status).toBe("hidden");
    expect(await setCommentStatus(db, c1, "visible")).toBe(true);
    expect(await setCommentStatus(db, 9999, "hidden")).toBe(false);
  });

  it("deletes a comment with its replies and reports", async () => {
    expect(await deleteComment(db, c1)).toBe(true);
    expect(await db.select().from(schema.blogComments)).toHaveLength(2);
    expect(await deleteComment(db, c1)).toBe(false);
    await deleteComment(db, c3);
    expect(await db.select().from(schema.blogCommentReports)).toHaveLength(1);
  });

  it("bans, unbans and marks the author's account", async () => {
    expect(await updateReader(db, "u2", { banned: true })).toBe(true);
    expect(await updateReader(db, "u1", { isAuthor: true })).toBe(true);
    const rows = await db.select().from(schema.readerUser);
    expect(rows.find((r) => r.id === "u2")?.banned).toBe(true);
    expect(rows.find((r) => r.id === "u1")?.isAuthor).toBe(true);
    expect(await updateReader(db, "u2", { banned: false })).toBe(true);
    expect(await updateReader(db, "nobody", { banned: true })).toBe(false);
    expect(await updateReader(db, "u1", {})).toBe(false);
  });
});

describe("the Posts list", () => {
  it("counts the visible comments of each post", async () => {
    expect((await listPosts(db))[0].commentCount).toBe(4);
    await setCommentStatus(db, c1, "hidden");
    expect((await listPosts(db))[0].commentCount).toBe(3);
  });
});
