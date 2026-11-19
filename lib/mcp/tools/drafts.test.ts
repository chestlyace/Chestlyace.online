import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import * as schema from "@/db/schema";
import { createPost, updatePost } from "@/lib/admin/blogApi";
import { addFeedback } from "@/lib/blog/draftFeedback";
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

let postId: number;
beforeEach(async () => {
  await db.delete(schema.blogPosts);
  await db.delete(schema.agentActivity);
  await db.delete(schema.agentTokens);
  const created = await createPost(db, {
    title: "A draft",
    slug: "a-draft",
    description: "About it",
    content: "Words.",
  });
  if (!created.ok) throw new Error("create failed");
  postId = created.post.id;
});

const tokenFrom = (url: string) => url.split("/drafts/")[1];

describe("draft sharing over MCP (S.4)", () => {
  it("lists each tool only for the scope it needs", async () => {
    const names = async (scopes: string[]) =>
      (await (await connectAs(db, scopes)).client.listTools()).tools.map(
        (tool) => tool.name,
      );
    const reader = await names(["read"]);
    expect(reader).toContain("blog_draft_feedback_list");
    expect(reader).not.toContain("blog_post_share");
    expect(reader).not.toContain("blog_draft_feedback_mark_read");

    const writer = await names(["read", "write"]);
    expect(writer).toContain("blog_draft_feedback_mark_read");
    expect(writer).not.toContain("blog_post_share");

    expect(await names(["read", "publish"])).not.toContain("blog_post_share");
    const publisher = await names(["read", "write", "publish"]);
    expect(publisher).toEqual(
      expect.arrayContaining(["blog_post_share", "blog_post_unshare"]),
    );
    expect(await names(["read", "delete"])).toContain(
      "blog_draft_feedback_delete",
    );
  });

  it("shares a draft, answers the same link again, renews it and turns it off", async () => {
    const { call } = await connectAs(db, ["read", "write", "publish"]);
    const first = await call("blog_post_share", { id: postId });
    expect(first.error, first.text).toBe(false);
    expect(first.data.url).toMatch(/\/drafts\/[A-Za-z0-9_-]{43}$/);
    expect(first.data.urlFr).toContain("/fr/drafts/");
    expect(tokenFrom(first.data.urlFr)).toBe(tokenFrom(first.data.url));

    const again = await call("blog_post_share", { id: postId });
    expect(again.data.url).toBe(first.data.url);

    const renewed = await call("blog_post_share", { id: postId, renew: true });
    expect(renewed.data.url).not.toBe(first.data.url);

    const off = await call("blog_post_unshare", { id: postId });
    expect(off.data).toMatchObject({ shared: false });
    const [row] = await db.select().from(schema.blogPosts);
    expect(row.shareToken).toBeNull();
  });

  it("refuses a published post and an unknown id", async () => {
    await updatePost(db, postId, { status: "published" });
    const { call } = await connectAs(db, ["read", "write", "publish"]);
    const published = await call("blog_post_share", { id: postId });
    expect(published.error).toBe(true);
    expect(published.text).toMatch(/Only a draft/);
    expect((await call("blog_post_share", { id: 9999 })).text).toMatch(
      /blog_list/,
    );
  });

  it("reads, marks read and deletes a draft's feedback, deleting only by the sender's name", async () => {
    const publisher = await connectAs(db, ["read", "write", "publish"]);
    const shared = await publisher.call("blog_post_share", { id: postId });
    const token = tokenFrom(shared.data.url);
    for (const [name, body] of [
      ["Ada", "Cut the intro."],
      ["Grace", "Add a diagram."],
    ])
      await addFeedback(
        db,
        { token, name, body, lang: "en" },
        { maxWords: 300 },
      );

    const reader = await connectAs(db, ["read"]);
    const listed = await reader.call("blog_draft_feedback_list", {
      id: postId,
    });
    expect(listed.data.unread).toBe(2);
    expect(
      listed.data.items.map((item: { name: string }) => item.name),
    ).toEqual(["Grace", "Ada"]);
    const [grace, ada] = listed.data.items;

    const writer = await connectAs(db, ["read", "write"]);
    expect(
      (await writer.call("blog_draft_feedback_mark_read", { id: postId }))
        .error,
    ).toBe(true);
    expect(
      (
        await writer.call("blog_draft_feedback_mark_read", {
          id: postId,
          ids: [ada.id],
        })
      ).data.marked,
    ).toBe(1);
    expect(
      (
        await writer.call("blog_draft_feedback_mark_read", {
          id: postId,
          all: true,
        })
      ).data.marked,
    ).toBe(1);

    const deleter = await connectAs(db, ["read", "delete"]);
    const wrong = await deleter.call("blog_draft_feedback_delete", {
      id: postId,
      feedbackId: grace.id,
      confirm: "grace",
    });
    expect(wrong.error).toBe(true);
    expect(wrong.text).toContain('"Grace"');
    expect(
      (
        await deleter.call("blog_draft_feedback_delete", {
          id: postId,
          feedbackId: grace.id,
          confirm: "Grace",
        })
      ).data,
    ).toEqual({ deleted: "Grace" });
    const after = await reader.call("blog_draft_feedback_list", { id: postId });
    expect(after.data).toMatchObject({ unread: 0 });
    expect(after.data.items).toHaveLength(1);
  });
});
