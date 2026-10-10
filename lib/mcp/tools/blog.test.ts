import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import * as schema from "@/db/schema";
import type { Database } from "@/lib/db";
import { connectAs, testDb } from "../testkit";

vi.mock("next/cache", () => ({
  revalidateTag: () => {},
  unstable_cache: (fn: unknown) => fn,
}));

let db: Database;
beforeAll(async () => {
  db = await testDb();
}, 30_000);
beforeEach(async () => {
  await db.delete(schema.blogPosts);
  await db.delete(schema.agentActivity);
  await db.delete(schema.agentTokens);
});

const GOOD = "## Hello\n\nA paragraph.";
const post = (extra: object = {}) => ({
  title: "First",
  slug: "first",
  description: "About it",
  content: GOOD,
  ...extra,
});

describe("blog tools and scopes", () => {
  it("shows read tools to read, write tools to write, publish and delete on their own scopes", async () => {
    const names = async (scopes: string[]) =>
      (await (await connectAs(db, scopes)).client.listTools()).tools
        .map((t) => t.name)
        .filter((n) => n.startsWith("blog_"));
    const read = await names(["read"]);
    expect(read.sort()).toEqual([
      "blog_comments_list",
      "blog_get",
      "blog_list",
      "blog_validate",
    ]);
    const write = await names(["read", "write"]);
    expect(write).toEqual(
      expect.arrayContaining(["blog_create", "blog_update", "blog_duplicate"]),
    );
    expect(write).not.toContain("blog_publish");
    expect(write).not.toContain("blog_delete");
    expect(await names(["read", "publish"])).not.toContain("blog_publish");
    expect(await names(["read", "write", "publish"])).toEqual(
      expect.arrayContaining(["blog_publish", "blog_unpublish"]),
    );
    expect(await names(["read", "delete"])).toEqual(
      expect.arrayContaining([
        "blog_delete",
        "blog_comment_hide",
        "blog_comment_restore",
        "blog_comment_delete",
      ]),
    );
  });
});

describe("writing and publishing", () => {
  it("creates a draft, lists and reads it, updates it", async () => {
    const { call } = await connectAs(db, ["read", "write"]);
    const created = await call("blog_create", post());
    expect(created.data).toMatchObject({ slug: "first", status: "draft" });
    const id = created.data.id;
    expect((await call("blog_list")).data.items).toHaveLength(1);
    expect(
      (await call("blog_list", { status: "published" })).data.items,
    ).toHaveLength(0);
    expect((await call("blog_get", { slug: "first" })).data.content).toBe(GOOD);
    await call("blog_update", { id, title: "Renamed", tags: ["a"] });
    expect((await call("blog_get", { id })).data).toMatchObject({
      title: "Renamed",
      tags: ["a"],
      slug: "first",
    });
  });

  it("explains a rejected post field by field, and an address already used", async () => {
    const { call } = await connectAs(db, ["read", "write"]);
    const bad = await call("blog_create", post({ slug: "Bad Slug" }));
    expect(bad.error).toBe(true);
    expect(bad.text).toContain("slug");
    await call("blog_create", post());
    const clash = await call("blog_create", post());
    expect(clash.error).toBe(true);
    expect(clash.text).toMatch(/already uses/);
    expect((await call("blog_update", { id: 999999, title: "x" })).error).toBe(
      true,
    );
  });

  it("never creates a live post, even when asked", async () => {
    const { call } = await connectAs(db, ["read", "write", "publish"]);
    const created = await call("blog_create", {
      ...post(),
      status: "published",
    });
    expect(created.data.status).toBe("draft");
  });

  it("publishes and unpublishes only with the publish scope, and checks the post is whole", async () => {
    const writer = await connectAs(db, ["read", "write"]);
    const { data } = await writer.call(
      "blog_create",
      post({ description: "" }),
    );
    const publisher = await connectAs(db, ["read", "write", "publish"]);
    const refused = await publisher.call("blog_publish", { id: data.id });
    expect(refused.error).toBe(true);
    expect(refused.text).toMatch(/description/);
    await publisher.call("blog_update", {
      id: data.id,
      description: "Now there",
    });
    const live = await publisher.call("blog_publish", { id: data.id });
    expect(live.data.status).toBe("published");
    expect(live.data.publishedAt).toBeTruthy();
    expect(
      (await publisher.call("blog_unpublish", { id: data.id })).data.status,
    ).toBe("draft");
  });

  it("keeps the French version's live switch unless the token may publish", async () => {
    const writer = await connectAs(db, ["read", "write"]);
    const { data } = await writer.call(
      "blog_create",
      post({ translations: { fr: { title: "Premier", content: "## Salut" } } }),
    );
    const wantsLive = await writer.call("blog_update", {
      id: data.id,
      translations: {
        fr: { title: "Premier", content: "## Salut", published: true },
      },
    });
    expect(wantsLive.error).toBe(true);
    expect(wantsLive.text).toMatch(/publish scope/);
    const created = await writer.call(
      "blog_create",
      post({ slug: "x", translations: { fr: { published: true } } }),
    );
    expect(created.error).toBe(true);

    const publisher = await connectAs(db, ["read", "write", "publish"]);
    await publisher.call("blog_publish", { id: data.id, french: true });
    expect(
      (await publisher.call("blog_get", { id: data.id })).data.translations.fr
        .published,
    ).toBe(true);
    // editing the French text without the switch keeps it as it was
    await writer.call("blog_update", {
      id: data.id,
      translations: { fr: { title: "Le premier", content: "## Salut" } },
    });
    const fr = (await writer.call("blog_get", { id: data.id })).data
      .translations.fr;
    expect(fr).toMatchObject({ title: "Le premier", published: true });
  });

  it("checks Markdown without saving, and copies a post as a draft", async () => {
    const { call } = await connectAs(db, ["read", "write"]);
    const check = await call("blog_validate", {
      content: GOOD,
      description: "d",
    });
    expect(check.data.canPublish).toBe(true);
    const unfit = await call("blog_validate", { content: GOOD });
    expect(unfit.data.canPublish).toBe(true);
    const { data } = await call("blog_create", post());
    const copy = await call("blog_duplicate", { id: data.id });
    expect(copy.data).toMatchObject({ slug: "first-copy", status: "draft" });
  });
});

describe("deleting and moderating", () => {
  it("deletes a post only when the slug is repeated", async () => {
    const writer = await connectAs(db, ["read", "write"]);
    const { data } = await writer.call("blog_create", post());
    const { call } = await connectAs(db, ["read", "delete"]);
    const wrong = await call("blog_delete", { id: data.id, confirm: "nope" });
    expect(wrong.error).toBe(true);
    expect(wrong.text).toContain('"first"');
    expect((await call("blog_list")).data.items).toHaveLength(1);
    expect(
      (await call("blog_delete", { id: data.id, confirm: "first" })).data,
    ).toEqual({
      deleted: "first",
    });
    expect((await call("blog_list")).data.items).toHaveLength(0);
  });

  it("hides, restores and deletes comments", async () => {
    const writer = await connectAs(db, ["read", "write"]);
    const { data } = await writer.call("blog_create", post());
    const [comment] = await db
      .insert(schema.blogComments)
      .values({ postId: data.id, body: "Nice", status: "visible" })
      .returning();
    const { call } = await connectAs(db, ["read", "delete"]);
    expect((await call("blog_comments_list")).data.items).toHaveLength(1);
    await call("blog_comment_hide", { id: comment.id });
    expect(
      (await call("blog_comments_list", { filter: "hidden" })).data.items,
    ).toHaveLength(1);
    await call("blog_comment_restore", { id: comment.id });
    expect(
      (await call("blog_comments_list", { filter: "hidden" })).data.items,
    ).toHaveLength(0);
    expect(
      (await call("blog_comment_delete", { id: comment.id, confirm: "x" }))
        .error,
    ).toBe(true);
    await call("blog_comment_delete", {
      id: comment.id,
      confirm: String(comment.id),
    });
    expect((await call("blog_comments_list")).data.items).toHaveLength(0);
    expect((await call("blog_comment_hide", { id: comment.id })).error).toBe(
      true,
    );
  });
});
