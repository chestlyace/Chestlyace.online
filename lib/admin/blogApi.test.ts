import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { beforeEach, describe, expect, it } from "vitest";
import * as schema from "@/db/schema";
import type { Database } from "@/lib/db";
import {
  createPost,
  deletePost,
  duplicatePost,
  getPost,
  listPosts,
  updatePost,
} from "./blogApi";

let db: Database;
beforeEach(async () => {
  const fresh = drizzle(new PGlite(), { schema });
  await migrate(fresh, { migrationsFolder: "db/migrations" });
  db = fresh;
}, 30_000);

const draft = (over: Record<string, unknown> = {}) => ({
  title: "A post",
  slug: "a-post",
  ...over,
});

async function made(over: Record<string, unknown> = {}) {
  const result = await createPost(db, draft(over));
  if (!result.ok) throw new Error(JSON.stringify(result));
  return result.post;
}

describe("createPost", () => {
  it("makes a draft with defaults from just a title and an address", async () => {
    const post = await made();
    expect(post).toMatchObject({
      status: "draft",
      description: "",
      content: "",
      tags: [],
      commentsEnabled: true,
      publishedAt: null,
    });
  });

  it("refuses bad fields, naming each", async () => {
    const result = await createPost(
      db,
      draft({
        title: "",
        slug: "Bad Slug",
        tags: ["Not Kebab", "a", "b", "c", "d", "e", "f", "g", "h"],
        description: "x".repeat(301),
      }),
    );
    expect(result).toMatchObject({ ok: false, status: 422 });
    if (!result.ok && result.status === 422) {
      expect(Object.keys(result.fields).sort()).toEqual([
        "description",
        "slug",
        "tags",
        "title",
      ]);
    }
  });

  it("refuses the blog's own paths and unknown fields, and a taken address", async () => {
    for (const slug of ["tags", "api", "rss.xml"]) {
      expect(await createPost(db, draft({ slug }))).toMatchObject({
        ok: false,
      });
    }
    expect(await createPost(db, draft({ extra: 1 }))).toMatchObject({
      ok: false,
    });
    await made();
    const clash = await createPost(db, draft());
    expect(clash).toMatchObject({
      ok: false,
      fields: { slug: expect.stringContaining("already") },
    });
  });

  it("refuses to publish without a description or with a block that can't be read", async () => {
    const bare = await createPost(db, draft({ status: "published" }));
    expect(bare).toMatchObject({
      ok: false,
      fields: { description: expect.any(String) },
    });
    const bad = await createPost(
      db,
      draft({
        status: "published",
        description: "d",
        content: "![](https://x.test/a.webp)",
      }),
    );
    expect(bad).toMatchObject({
      ok: false,
      fields: { content: expect.stringContaining("alt") },
    });
    const good = await createPost(
      db,
      draft({
        status: "published",
        description: "d",
        content: "## Hi\n\nText.",
      }),
    );
    expect(good).toMatchObject({ ok: true });
    if (good.ok) expect(good.post.publishedAt).toBeInstanceOf(Date);
  });
});

describe("the French version", () => {
  const fr = (over: Record<string, unknown> = {}) => ({
    title: "Titre",
    content: "Un paragraphe.",
    published: true,
    ...over,
  });
  const live = (over: Record<string, unknown> = {}) => ({
    description: "About it",
    content: "Some English.",
    status: "published",
    ...over,
  });

  it("stores the French text and keeps only what was written", async () => {
    const post = await made({
      translations: { fr: fr({ description: "   ", series: "" }) },
    });
    expect(post.translations).toEqual({
      fr: { title: "Titre", content: "Un paragraphe.", published: true },
    });
  });

  it("refuses unknown French fields and a French text that is too long", async () => {
    const unknown = await createPost(
      db,
      draft({ translations: { fr: { tags: ["x"] } } }),
    );
    expect(unknown.ok).toBe(false);
    const long = await createPost(
      db,
      draft({ translations: { fr: { content: "x".repeat(200_001) } } }),
    );
    expect(long.ok).toBe(false);
  });

  it("will not publish the French version without its text, or with a block it cannot read", async () => {
    const empty = await createPost(
      db,
      draft(live({ translations: { fr: { published: true } } })),
    );
    expect(empty).toMatchObject({
      ok: false,
      fields: { "fr:content": "Add the French text before publishing it." },
    });
    const broken = await createPost(
      db,
      draft(
        live({
          slug: "broken",
          translations: {
            fr: fr({ content: "![](https://x.test/a.webp)" }),
          },
        }),
      ),
    );
    expect(broken).toMatchObject({
      ok: false,
      fields: { "fr:content": expect.stringContaining("alt") },
    });
  });

  it("lets a French draft wait, and checks again when it is switched on", async () => {
    const post = await made(
      live({ translations: { fr: fr({ published: false, content: "" }) } }),
    );
    const on = await updatePost(db, post.id, {
      translations: { fr: fr({ content: "", published: true }) },
    });
    expect(on.ok).toBe(false);
    const ok = await updatePost(db, post.id, {
      translations: { fr: fr({ published: true }) },
    });
    expect(ok.ok).toBe(true);
  });

  it("lists whether a post has French, and a copy brings it along switched off", async () => {
    const post = await made({ translations: { fr: fr() } });
    await made({ slug: "no-french" });
    expect((await listPosts(db)).map((p) => [p.slug, p.french])).toEqual(
      expect.arrayContaining([
        ["a-post", "live"],
        ["no-french", "none"],
      ]),
    );
    const copy = await duplicatePost(db, post.id);
    expect(copy.ok && copy.post.translations).toEqual({
      fr: { title: "Titre", content: "Un paragraphe.", published: false },
    });
  });
});

describe("updatePost", () => {
  it("changes only what is sent, and an empty change is refused", async () => {
    const post = await made({ description: "Keep me" });
    const result = await updatePost(db, post.id, { title: "New title" });
    expect(result).toMatchObject({
      ok: true,
      post: { title: "New title", description: "Keep me" },
    });
    expect(await updatePost(db, post.id, {})).toMatchObject({
      ok: false,
      fields: { _: expect.any(String) },
    });
    expect(await updatePost(db, 9999, { title: "x" })).toMatchObject({
      ok: false,
      status: 404,
    });
  });

  it("stamps the date on first publish, keeps it when unpublished and republished", async () => {
    const post = await made({ description: "d", content: "Text" });
    const live = await updatePost(db, post.id, { status: "published" });
    expect(live.ok && live.post.publishedAt).toBeTruthy();
    const first = live.ok ? live.post.publishedAt : null;
    const down = await updatePost(db, post.id, { status: "draft" });
    expect(down.ok && down.post.publishedAt).toEqual(first);
    const again = await updatePost(db, post.id, { status: "published" });
    expect(again.ok && again.post.publishedAt).toEqual(first);
  });

  it("checks a published post's content again when it changes", async () => {
    const post = await made({
      description: "d",
      content: "Text",
      status: "published",
    });
    const result = await updatePost(db, post.id, { content: "![](a.webp)" });
    expect(result).toMatchObject({
      ok: false,
      fields: { content: expect.any(String) },
    });
  });

  it("takes a chosen published date", async () => {
    const post = await made({
      description: "d",
      status: "published",
      publishedAt: "2026-01-02",
    });
    expect(post.publishedAt?.toISOString().slice(0, 10)).toBe("2026-01-02");
  });
});

describe("listPosts, duplicatePost, deletePost", () => {
  it("lists newest first with drafts, and finds one by id", async () => {
    const a = await made({
      slug: "a",
      title: "A",
      description: "d",
      status: "published",
      publishedAt: "2026-01-01",
    });
    const b = await made({
      slug: "b",
      title: "B",
      description: "d",
      status: "published",
      publishedAt: "2026-03-01",
    });
    const c = await made({ slug: "c", title: "C" });
    const list = await listPosts(db);
    expect(list.map((p) => p.id)).toContain(c.id);
    expect(list.findIndex((p) => p.id === b.id)).toBeLessThan(
      list.findIndex((p) => p.id === a.id),
    );
    expect(list.find((p) => p.id === c.id)).toMatchObject({
      status: "draft",
      publishedAt: null,
      likeCount: 0,
    });
    expect((await getPost(db, a.id))?.title).toBe("A");
    expect(await getPost(db, 9999)).toBeNull();
  });

  it("duplicates as a draft with its own address, again and again", async () => {
    const post = await made({
      description: "d",
      content: "Text",
      status: "published",
      tags: ["x"],
    });
    const one = await duplicatePost(db, post.id);
    const two = await duplicatePost(db, post.id);
    expect(one).toMatchObject({
      ok: true,
      post: {
        title: "Copy of A post",
        slug: "a-post-copy",
        status: "draft",
        publishedAt: null,
        tags: ["x"],
        content: "Text",
      },
    });
    expect(two).toMatchObject({ ok: true, post: { slug: "a-post-copy-2" } });
    expect(await duplicatePost(db, 9999)).toMatchObject({
      ok: false,
      status: 404,
    });
  });

  it("deletes", async () => {
    const post = await made();
    expect(await deletePost(db, post.id)).toEqual({ ok: true });
    expect(await deletePost(db, post.id)).toMatchObject({
      ok: false,
      status: 404,
    });
  });
});
