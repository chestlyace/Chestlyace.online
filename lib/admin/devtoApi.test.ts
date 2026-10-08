import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as schema from "@/db/schema";
import type { Database } from "@/lib/db";
import { createPost, getPost } from "./blogApi";
import { exportPost, findArticles, importArticles } from "./devtoApi";

let db: Database;
beforeEach(async () => {
  const fresh = drizzle(new PGlite(), { schema });
  await migrate(fresh, { migrationsFolder: "db/migrations" });
  db = fresh;
}, 30_000);

const reply = (body: unknown, status = 200) =>
  Promise.resolve(new Response(JSON.stringify(body), { status }));

const ARTICLES: Record<number, Record<string, unknown>> = {
  1: {
    id: 1,
    title: "First post",
    description: "About the first.",
    body_markdown:
      "Hello.\n\n{% poll 5 %}\n\n![A](https://dev-to-uploads.s3.amazonaws.com/a.png)\n",
    tags: ["JavaScript", "Web Dev"],
    cover_image: "https://dev.to/c.png",
    url: "https://dev.to/me/first-1",
    canonical_url: "https://dev.to/me/first-1",
    published_at: "2025-02-03T00:00:00Z",
  },
  2: {
    id: 2,
    title: "First post",
    description: "Same title.",
    body_markdown: "Body two.",
    tags: [],
    url: "https://dev.to/me/first-2",
  },
  3: {
    id: 3,
    title: "Broken cover",
    description: "d",
    body_markdown: "x",
    cover_image: "not a url at all",
    url: "https://dev.to/me/b",
  },
};

const dev = vi.fn((url: RequestInfo | URL) => {
  const u = String(url);
  const one = u.match(/\/articles\/(\d+)$/);
  if (one)
    return ARTICLES[Number(one[1])]
      ? reply(ARTICLES[Number(one[1])])
      : reply({ error: "not found" }, 404);
  if (u.includes("/articles?username="))
    return reply(
      Object.values(ARTICLES)
        .slice(0, 2)
        .map((a) => ({
          id: a.id,
          title: a.title,
          url: a.url,
          tag_list: a.tags,
          published_at: a.published_at ?? null,
        })),
    );
  return reply({}, 404);
});

describe("importArticles", () => {
  it("creates a draft from each article, with the DEV link, a unique address and a report", async () => {
    const reports = await importArticles(db, dev as never, [1, 2]);
    expect(reports.map((r) => r.status)).toEqual(["imported", "imported"]);
    const first = await getPost(db, reports[0].postId!);
    const second = await getPost(db, reports[1].postId!);
    expect(first).toMatchObject({
      status: "draft",
      slug: "first-post",
      tags: ["javascript", "web-dev"],
      devtoId: 1,
      devtoUrl: "https://dev.to/me/first-1",
      canonicalUrl: null,
      coverUrl: "https://dev.to/c.png",
    });
    expect(first?.publishedAt?.toISOString().slice(0, 10)).toBe("2025-02-03");
    expect(first?.content).toContain("`{% poll 5 %}`");
    expect(second?.slug).toBe("first-post-2");
    expect(reports[0].warnings.join(" ")).toMatch(/poll/);
    expect(reports[0].warnings.join(" ")).toMatch(/still hosted on DEV/);
  });

  it("skips what was imported before and reports an article DEV can't find", async () => {
    await importArticles(db, dev as never, [1]);
    const again = await importArticles(db, dev as never, [1, 99]);
    expect(again[0]).toMatchObject({ status: "skipped", title: "First post" });
    expect(again[1]).toMatchObject({
      status: "failed",
      error: expect.stringMatching(/couldn't find/),
    });
  });

  it("leaves out a field the blog won't take, and says so", async () => {
    const [report] = await importArticles(db, dev as never, [3]);
    expect(report.status).toBe("imported");
    expect(report.warnings.join(" ")).toMatch(/cover image couldn't be used/);
    expect((await getPost(db, report.postId!))?.coverUrl).toBeNull();
  });
});

describe("findArticles", () => {
  it("marks the ones already imported", async () => {
    await importArticles(db, dev as never, [1]);
    const found = await findArticles(db, dev as never, "me");
    expect(found.map((a) => [a.id, a.imported])).toEqual([
      [1, true],
      [2, false],
    ]);
  });
});

describe("exportPost", () => {
  const made = async (over: Record<string, unknown> = {}) => {
    const created = await createPost(db, {
      title: "Mine",
      slug: "mine",
      description: "About mine.",
      content: "Hello.\n\n```steps\n## One\nDo.\n```",
      tags: ["web-dev", "cx"],
      coverUrl: "https://x.test/c.png",
      series: "S",
      ...over,
    });
    if (!created.ok) throw new Error(JSON.stringify(created));
    return created.post;
  };
  const postUrl = (slug: string) => `https://blog.test/${slug}`;
  const sender = (id = 77) =>
    vi.fn((_: RequestInfo | URL, init?: RequestInit) =>
      reply(
        { id, url: `https://dev.to/me/p-${id}` },
        init?.method === "POST" ? 201 : 200,
      ),
    );

  it("needs the key, a saved post with something to send", async () => {
    const post = await made();
    expect(
      await exportPost(db, sender() as never, null, post.id, {
        publish: false,
        postUrl,
      }),
    ).toMatchObject({ ok: false, status: 400 });
    expect(
      await exportPost(db, sender() as never, "K", 9999, {
        publish: false,
        postUrl,
      }),
    ).toMatchObject({ ok: false, status: 404 });
    const empty = await made({ slug: "empty", content: "" });
    expect(
      await exportPost(db, sender() as never, "K", empty.id, {
        publish: false,
        postUrl,
      }),
    ).toMatchObject({ ok: false, status: 400 });
  });

  it("creates a draft on DEV with the canonical address, then updates the same article", async () => {
    const post = await made();
    const send = sender();
    const first = await exportPost(db, send as never, "K", post.id, {
      publish: false,
      postUrl,
    });
    expect(first).toMatchObject({
      ok: true,
      created: true,
      url: "https://dev.to/me/p-77",
    });
    const [createUrl, createInit] = send.mock.calls[0];
    expect(String(createUrl)).toBe("https://dev.to/api/articles");
    const article = JSON.parse(String(createInit?.body)).article;
    expect(article).toMatchObject({
      title: "Mine",
      published: false,
      tags: ["webdev", "cx"],
      canonical_url: "https://blog.test/mine",
      main_image: "https://x.test/c.png",
      series: "S",
    });
    expect(article.body_markdown).toContain("### 1. One");
    expect(article.body_markdown).toContain("Originally published at");
    expect(await getPost(db, post.id)).toMatchObject({
      devtoId: 77,
      devtoUrl: "https://dev.to/me/p-77",
    });

    const second = await exportPost(db, send as never, "K", post.id, {
      publish: true,
      postUrl,
    });
    expect(second).toMatchObject({ ok: true, created: false });
    expect(String(send.mock.calls[1][0])).toBe(
      "https://dev.to/api/articles/77",
    );
    expect(send.mock.calls[1][1]?.method).toBe("PUT");
    expect(
      JSON.parse(String(send.mock.calls[1][1]?.body)).article.published,
    ).toBe(true);
  });

  it("explains a deleted article and can create a new one instead", async () => {
    const post = await made();
    await exportPost(db, sender(77) as never, "K", post.id, {
      publish: false,
      postUrl,
    });
    const gone = vi.fn(() => reply({ error: "not found" }, 404));
    expect(
      await exportPost(db, gone as never, "K", post.id, {
        publish: false,
        postUrl,
      }),
    ).toMatchObject({ ok: false, status: 409 });
    const fresh = await exportPost(db, sender(88) as never, "K", post.id, {
      publish: false,
      fresh: true,
      postUrl,
    });
    expect(fresh).toMatchObject({ ok: true, created: true, devId: 88 });
  });

  it("passes DEV's own message on", async () => {
    const post = await made();
    const bad = vi.fn(() =>
      reply({ error: "Title has already been taken" }, 422),
    );
    expect(
      await exportPost(db, bad as never, "K", post.id, {
        publish: false,
        postUrl,
      }),
    ).toEqual({
      ok: false,
      status: 502,
      error: "Title has already been taken",
    });
  });
});
