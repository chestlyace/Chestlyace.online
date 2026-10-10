import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { eq } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import * as schema from "@/db/schema";
import type { Database } from "@/lib/db";
import {
  countTags,
  getAgentSession,
  getNewsletterCopy,
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

describe("blog reads in French", () => {
  const withFrench = (
    published: boolean,
    extra: Record<string, unknown> = {},
  ) => ({
    fr: {
      title: "Titre français",
      description: "À propos",
      content: "mot ".repeat(650),
      published,
      ...extra,
    },
  });

  beforeEach(async () => {
    await db
      .update(schema.blogPosts)
      .set({ translations: withFrench(true, { series: "Série" }) })
      .where(eq(schema.blogPosts.slug, "newest"));
    await db
      .update(schema.blogPosts)
      .set({ translations: withFrench(false) })
      .where(eq(schema.blogPosts.slug, "oldest"));
  });

  it("changes nothing for English", async () => {
    const posts = await listPublishedPosts(db);
    expect(posts[0].title).toBe("NEWEST");
    expect(posts.every((p) => p.lang === "en")).toBe(true);
    expect(posts[0]).not.toHaveProperty("fr");
    expect(posts[0]).not.toHaveProperty("frenchLive");
  });

  it("lists every post in French, the ones with a published French version in French", async () => {
    const posts = await listPublishedPosts(db, "fr");
    expect(posts.map((p) => [p.slug, p.lang])).toEqual([
      ["newest", "fr"],
      ["middle", "en"],
      ["oldest", "en"], // a French draft waits
    ]);
    expect(posts[0].title).toBe("Titre français");
    expect(posts[0].description).toBe("À propos");
    expect(posts[0].readingMinutes).toBe(4); // the French text's 650 words
    expect(posts[1].title).toBe("MIDDLE");
  });

  it("keeps the English for a French field that is blank", async () => {
    await db
      .update(schema.blogPosts)
      .set({ translations: withFrench(true, { title: "  " }) })
      .where(eq(schema.blogPosts.slug, "newest"));
    const [first] = await listPublishedPosts(db, "fr");
    expect(first.title).toBe("NEWEST");
    expect(first.description).toBe("À propos");
    expect(first.lang).toBe("fr");
  });

  it("is English when the French has no text, even if switched on", async () => {
    await db
      .update(schema.blogPosts)
      .set({ translations: withFrench(true, { content: "  " }) })
      .where(eq(schema.blogPosts.slug, "newest"));
    expect((await listPublishedPosts(db, "fr"))[0].lang).toBe("en");
  });

  it("gets the post in French, with its French text, series and neighbours", async () => {
    const page = await getPublishedPost(db, "newest", "fr");
    expect(page?.post.lang).toBe("fr");
    expect(page?.post.title).toBe("Titre français");
    expect(page?.post.series).toBe("Série");
    expect(page?.post.content.startsWith("mot mot")).toBe(true);
    expect(page?.post.canonicalUrl).toBeNull();
    expect(page?.previous?.slug).toBe("middle");

    const english = await getPublishedPost(db, "newest");
    expect(english?.post.title).toBe("NEWEST");
    expect(english?.post.content.startsWith("word")).toBe(true);
  });

  it("reads an English-only post as English on the French blog", async () => {
    const page = await getPublishedPost(db, "middle", "fr");
    expect(page?.post.lang).toBe("en");
    expect(page?.post.content).toBe("short");
    const draft = await getPublishedPost(db, "oldest", "fr");
    expect(draft?.post.lang).toBe("en");
    expect(draft?.post.title).toBe("OLDEST");
  });

  it("keeps the cross-post canonical on the English text only", async () => {
    await db
      .update(schema.blogPosts)
      .set({ canonicalUrl: "https://dev.to/x/newest" })
      .where(eq(schema.blogPosts.slug, "newest"));
    expect((await getPublishedPost(db, "newest"))?.post.canonicalUrl).toBe(
      "https://dev.to/x/newest",
    );
    expect(
      (await getPublishedPost(db, "newest", "fr"))?.post.canonicalUrl,
    ).toBeNull();
  });

  it("counts tags and lists tag pages from the posts with French only", async () => {
    expect(await listTags(db, "fr")).toEqual([{ tag: "nextjs", count: 1 }]);
    expect(
      (await listPostsByTag(db, "nextjs", "fr")).map((p) => p.slug),
    ).toEqual(["newest"]);
    expect(await listPostsByTag(db, "web", "fr")).toEqual([]);
    expect((await listPostsByTag(db, "nextjs")).map((p) => p.slug)).toEqual([
      "newest",
      "oldest",
    ]);
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

describe("getNewsletterCopy", () => {
  it("is the built-in wording until the owner saves some, then theirs", async () => {
    expect((await getNewsletterCopy(db)).box.title).toBe(
      "New posts, in your inbox",
    );
    await db.delete(schema.newsletterSettings);
    await db.insert(schema.newsletterSettings).values({
      id: 1,
      boxTitle: "Join in",
      confirmedTitle: "Welcome",
      enabled: false,
    });
    const copy = await getNewsletterCopy(db);
    expect(copy.enabled).toBe(false);
    expect(copy.box.title).toBe("Join in");
    expect(copy.confirmed.title).toBe("Welcome");
    expect(copy.failed.title).toBe("That link didn't work");
  });

  it("follows the language: French built-in wording, the owner's French first", async () => {
    await db.delete(schema.newsletterSettings);
    expect((await getNewsletterCopy(db, "fr")).box.title).toBe(
      "Les nouveaux articles, dans votre boîte mail",
    );
    await db.insert(schema.newsletterSettings).values({
      id: 1,
      boxTitle: "Join in",
      confirmedTitle: "Welcome",
      translations: { fr: { boxTitle: "Rejoignez-nous" } },
    });
    const copy = await getNewsletterCopy(db, "fr");
    expect(copy.box.title).toBe("Rejoignez-nous");
    // The owner's English with no French beside it is the fallback.
    expect(copy.confirmed.title).toBe("Welcome");
    // Nothing of theirs: the French built-in wording.
    expect(copy.failed.title).toBe("Ce lien n’a pas fonctionné");
    expect((await getNewsletterCopy(db)).box.title).toBe("Join in");
  });
});
