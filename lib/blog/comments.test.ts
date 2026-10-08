import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import * as schema from "@/db/schema";
import { seed } from "@/db/seed";
import type { Database } from "@/lib/db";
import {
  PAGE_SIZE,
  createComment,
  deleteOwnComment,
  listComments,
  reportComment,
  toggleCommentLike,
} from "./comments";

let db: Database;
const SLUG = "hello-world";
const opts = { maxWords: 20 };

beforeEach(async () => {
  const fresh = drizzle(new PGlite(), { schema });
  await migrate(fresh, { migrationsFolder: "db/migrations" });
  db = fresh;
  await seed(db);
  for (const [id, name, isAuthor] of [
    ["u1", "Ada", false],
    ["u2", "Bo", false],
    ["owner", "Chestly", true],
  ] as const)
    await db.insert(schema.readerUser).values({
      id,
      name,
      email: `${id}@example.com`,
      image: `https://img/${id}.png`,
      isAuthor,
    });
}, 30_000);

const post = async (userId: string, body: string, parentId?: number) => {
  const result = await createComment(
    db,
    { slug: SLUG, userId, body, parentId },
    opts,
  );
  if (!result.ok) throw new Error(JSON.stringify(result));
  return result.comment;
};

describe("createComment", () => {
  it("posts plain text at once with its author", async () => {
    const comment = await post("u1", "  Nice post!\n\n\n\nReally.  ");
    expect(comment).toMatchObject({
      body: "Nice post!\n\nReally.",
      mine: true,
      likeCount: 0,
      author: { name: "Ada", isAuthor: false },
    });
    const page = await listComments(db, SLUG, { viewerId: null });
    expect(page?.items).toHaveLength(1);
    expect(page?.total).toBe(1);
    expect(page?.items[0].mine).toBe(false);
  });

  it("refuses empty, over-long, and repeated comments, and posts that are closed or unknown", async () => {
    const send = (body: string, slug = SLUG) =>
      createComment(db, { slug, userId: "u1", body }, opts);
    expect(await send("   ")).toMatchObject({ ok: false, status: 422 });
    const long = await send("word ".repeat(21));
    expect(long).toMatchObject({
      ok: false,
      status: 422,
      message: expect.stringContaining("20 words"),
    });
    await send("First!");
    expect(await send("first!")).toMatchObject({
      ok: false,
      status: 422,
      message: expect.stringContaining("already posted"),
    });
    expect(await send("hi", "nope")).toMatchObject({ ok: false, status: 404 });
    await db
      .update(schema.blogPosts)
      .set({ commentsEnabled: false })
      .where(eq(schema.blogPosts.slug, SLUG));
    expect(await send("later")).toMatchObject({ ok: false, status: 403 });
    expect(await listComments(db, SLUG, { viewerId: null })).toMatchObject({
      enabled: false,
      items: [],
    });
  });

  it("allows the same words again once someone has answered the first", async () => {
    const first = await post("u1", "Thanks");
    await post("u2", "You're welcome", first.id);
    expect(
      (
        await createComment(
          db,
          { slug: SLUG, userId: "u1", body: "Thanks" },
          opts,
        )
      ).ok,
    ).toBe(true);
  });

  it("keeps replies one level deep: a reply to a reply joins the same parent", async () => {
    const top = await post("u1", "Top");
    const reply = await post("u2", "Reply", top.id);
    const deeper = await post("u1", "Deeper", reply.id);
    expect(deeper.parentId).toBe(top.id);
    const page = await listComments(db, SLUG, { viewerId: null });
    expect(page?.items[0].replies.map((r) => r.body)).toEqual([
      "Reply",
      "Deeper",
    ]);
    expect(page?.total).toBe(3);
  });
});

describe("listComments", () => {
  it("shows newest first, 20 at a time, with a cursor for more", async () => {
    for (let i = 1; i <= PAGE_SIZE + 5; i++)
      await post("u1", `Comment number ${i}`);
    const one = await listComments(db, SLUG, { viewerId: null });
    expect(one?.items).toHaveLength(PAGE_SIZE);
    expect(one?.items[0].body).toBe(`Comment number ${PAGE_SIZE + 5}`);
    expect(one?.nextCursor).not.toBeNull();
    const two = await listComments(db, SLUG, {
      viewerId: null,
      cursor: one!.nextCursor,
    });
    expect(two?.items).toHaveLength(5);
    expect(two?.nextCursor).toBeNull();
    expect(one?.total).toBe(PAGE_SIZE + 5);
  });

  it("shows the author tag, 'Deleted user' for a gone account, and hides what is hidden", async () => {
    const mine = await post("owner", "From the author");
    const gone = await post("u2", "From someone who left");
    const secret = await post("u1", "Hidden one");
    await db
      .update(schema.blogComments)
      .set({ status: "hidden" })
      .where(eq(schema.blogComments.id, secret.id));
    await db.delete(schema.readerUser).where(eq(schema.readerUser.id, "u2"));
    const page = await listComments(db, SLUG, { viewerId: null });
    expect(page?.items.map((c) => c.id)).toEqual([gone.id, mine.id]);
    expect(page?.items[1].author).toMatchObject({
      name: "Chestly",
      isAuthor: true,
    });
    expect(page?.items[0].author).toMatchObject({
      name: "Deleted user",
      image: null,
    });
    expect(page?.total).toBe(2);
  });

  it("keeps a hidden comment as a placeholder while it has visible replies", async () => {
    const top = await post("u1", "Will be removed");
    await post("u2", "A reply", top.id);
    await db
      .update(schema.blogComments)
      .set({ status: "hidden" })
      .where(eq(schema.blogComments.id, top.id));
    const page = await listComments(db, SLUG, { viewerId: null });
    expect(page?.items[0]).toMatchObject({
      removed: true,
      body: "",
      author: null,
    });
    expect(page?.items[0].replies.map((r) => r.body)).toEqual(["A reply"]);
  });
});

describe("delete, like and report", () => {
  it("lets a reader delete only their own; one with replies becomes a placeholder", async () => {
    const a = await post("u1", "Mine");
    expect(await deleteOwnComment(db, a.id, "u2")).toMatchObject({
      ok: false,
      status: 404,
    });
    expect(await deleteOwnComment(db, a.id, "u1")).toEqual({ ok: true });
    expect(
      (await listComments(db, SLUG, { viewerId: null }))?.items,
    ).toHaveLength(0);
    const b = await post("u1", "Has a reply");
    await post("u2", "Reply", b.id);
    await deleteOwnComment(db, b.id, "u1");
    const page = await listComments(db, SLUG, { viewerId: "u2" });
    expect(page?.items[0]).toMatchObject({ removed: true });
    expect(page?.items[0].replies).toHaveLength(1);
  });

  it("toggles a like per reader and keeps the count in step", async () => {
    const c = await post("u1", "Like me");
    expect(await toggleCommentLike(db, c.id, "u2")).toEqual({
      ok: true,
      count: 1,
      liked: true,
    });
    expect(await toggleCommentLike(db, c.id, "owner")).toEqual({
      ok: true,
      count: 2,
      liked: true,
    });
    expect(
      (await listComments(db, SLUG, { viewerId: "u2" }))?.items[0],
    ).toMatchObject({ liked: true, likeCount: 2 });
    expect(
      (await listComments(db, SLUG, { viewerId: "u1" }))?.items[0].liked,
    ).toBe(false);
    expect(await toggleCommentLike(db, c.id, "u2")).toEqual({
      ok: true,
      count: 1,
      liked: false,
    });
    expect(await toggleCommentLike(db, 9999, "u2")).toMatchObject({
      ok: false,
      status: 404,
    });
  });

  it("takes one report per reader, never from the author of the comment", async () => {
    const c = await post("u1", "Questionable");
    expect(await reportComment(db, c.id, "u2")).toEqual({ ok: true });
    expect(await reportComment(db, c.id, "u2")).toEqual({ ok: true });
    expect(await reportComment(db, c.id, "owner")).toEqual({ ok: true });
    expect(await db.select().from(schema.blogCommentReports)).toHaveLength(2);
    expect(await reportComment(db, c.id, "u1")).toMatchObject({
      ok: false,
      status: 422,
    });
    expect(await reportComment(db, 9999, "u2")).toMatchObject({
      ok: false,
      status: 404,
    });
  });

  it("deleting a post or an account behaves: comments go with the post, stay (anonymised) with the account", async () => {
    const c = await post("u1", "Stays");
    await db.delete(schema.readerUser).where(eq(schema.readerUser.id, "u1"));
    const [row] = await db
      .select()
      .from(schema.blogComments)
      .where(eq(schema.blogComments.id, c.id));
    expect(row.userId).toBeNull();
    await db.delete(schema.blogPosts).where(eq(schema.blogPosts.slug, SLUG));
    expect(await db.select().from(schema.blogComments)).toHaveLength(0);
  });
});
