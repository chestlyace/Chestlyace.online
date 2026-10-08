import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import * as schema from "@/db/schema";
import type { Database } from "@/lib/db";
import {
  countTags,
  getAgentSession,
  getPublishedPost,
  listPostsByTag,
  listPublishedPosts,
  listPublishedSlugs,
  listTags,
} from "./data";

let db: Database;
beforeAll(async () => {
  const instance = drizzle(new PGlite(), { schema });
  await migrate(instance, { migrationsFolder: "db/migrations" });
  db = instance;
}, 30_000);

const post = (
  slug: string,
  extra: Partial<typeof schema.blogPosts.$inferInsert> = {},
): typeof schema.blogPosts.$inferInsert => ({
  slug,
  title: slug.toUpperCase(),
  description: `About ${slug}`,
  content: "word ".repeat(450),
  status: "published",
  publishedAt: new Date("2026-01-01T00:00:00Z"),
  ...extra,
});

beforeEach(async () => {
  await db.delete(schema.blogPosts);
  await db.insert(schema.blogPosts).values([
    post("oldest", {
      publishedAt: new Date("2026-01-01T00:00:00Z"),
      tags: ["nextjs", "web"],
    }),
    post("middle", {
      publishedAt: new Date("2026-02-01T00:00:00Z"),
      tags: ["web"],
      content: "short",
    }),
    post("newest", {
      publishedAt: new Date("2026-03-01T00:00:00Z"),
      tags: ["nextjs"],
    }),
    post("draft", { status: "draft", publishedAt: null, tags: ["nextjs"] }),
    post("undated", { publishedAt: null, tags: ["web"] }),
  ]);
});

describe("blog reads", () => {
  it("lists published, dated posts newest first, as plain strings and numbers", async () => {
    const posts = await listPublishedPosts(db);
    expect(posts.map((p) => p.slug)).toEqual(["newest", "middle", "oldest"]);
    expect(posts[0].publishedAt).toBe("2026-03-01T00:00:00Z");
    expect(typeof posts[0].updatedAt).toBe("string");
    expect(posts.map((p) => p.readingMinutes)).toEqual([3, 1, 3]);
    expect(posts[0]).not.toHaveProperty("content");
    expect(await listPublishedSlugs(db)).toEqual([
      "newest",
      "middle",
      "oldest",
    ]);
  });

  it("breaks date ties by the newer id", async () => {
    await db
      .insert(schema.blogPosts)
      .values([
        post("same-a", { publishedAt: new Date("2026-04-01T00:00:00Z") }),
        post("same-b", { publishedAt: new Date("2026-04-01T00:00:00Z") }),
      ]);
    expect(
      (await listPublishedPosts(db)).slice(0, 2).map((p) => p.slug),
    ).toEqual(["same-b", "same-a"]);
  });

  it("gets a post with its older and newer neighbours", async () => {
    const page = await getPublishedPost(db, "middle");
    expect(page?.post.slug).toBe("middle");
    expect(page?.post.content).toBe("short");
    expect(page?.previous?.slug).toBe("oldest");
    expect(page?.next?.slug).toBe("newest");

    expect((await getPublishedPost(db, "newest"))?.next).toBeNull();
    expect((await getPublishedPost(db, "oldest"))?.previous).toBeNull();
  });

  it("never returns a draft, an undated post or an unknown slug", async () => {
    expect(await getPublishedPost(db, "draft")).toBeNull();
    expect(await getPublishedPost(db, "undated")).toBeNull();
    expect(await getPublishedPost(db, "nope")).toBeNull();
  });

  it("counts tags over published posts only, most used first", async () => {
    expect(await listTags(db)).toEqual(
      [
        { tag: "web", count: 2 },
        { tag: "nextjs", count: 2 },
      ].sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag)),
    );
    expect((await listTags(db)).find((t) => t.tag === "nextjs")?.count).toBe(2);
  });

  it("lists the posts with a tag", async () => {
    expect((await listPostsByTag(db, "nextjs")).map((p) => p.slug)).toEqual([
      "newest",
      "oldest",
    ]);
    expect(await listPostsByTag(db, "missing")).toEqual([]);
  });
});

describe("countTags", () => {
  it("counts a tag once per post and orders by count, then name", () => {
    expect(
      countTags([{ tags: ["b", "a", "a"] }, { tags: ["b"] }, { tags: ["c"] }]),
    ).toEqual([
      { tag: "b", count: 2 },
      { tag: "a", count: 1 },
      { tag: "c", count: 1 },
    ]);
  });
});

describe("getAgentSession", () => {
  it("reads a stored session by id, and nothing for an unknown one", async () => {
    const turns = [
      { prompt: "Hi", at: null, parts: [{ kind: "text", text: "Hello" }] },
    ];
    await db.insert(schema.agentSessions).values({
      id: "4f9c1a8e",
      title: "A session",
      turns: turns as never,
      turnCount: 1,
      toolCallCount: 0,
    });
    expect(await getAgentSession(db, "4f9c1a8e")).toEqual({
      id: "4f9c1a8e",
      title: "A session",
      turns,
    });
    expect(await getAgentSession(db, "ffffffff")).toBeNull();
  });
});
