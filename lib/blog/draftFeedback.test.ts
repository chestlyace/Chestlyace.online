import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import * as schema from "@/db/schema";
import {
  createPost,
  deletePost,
  listPosts,
  updatePost,
} from "@/lib/admin/blogApi";
import { sharePost, unsharePost } from "@/lib/admin/shareApi";
import type { Database } from "@/lib/db";
import {
  addFeedback,
  deleteFeedback,
  listFeedback,
  markFeedbackRead,
} from "./draftFeedback";
import { feedbackErrors, feedbackMaxWords } from "./feedbackText";
import { buildFeedbackEmail } from "./feedbackMail";

let db: Database;
beforeAll(async () => {
  const fresh = drizzle(new PGlite(), { schema });
  await migrate(fresh, { migrationsFolder: "db/migrations" });
  db = fresh;
}, 30_000);

beforeEach(async () => {
  await db.delete(schema.blogPosts);
});

async function sharedDraft(slug = "a-draft") {
  const created = await createPost(db, {
    title: "A draft",
    slug,
    description: "About it",
    content: "Words.",
  });
  if (!created.ok) throw new Error(JSON.stringify(created));
  const shared = await sharePost(db, created.post.id);
  if (!shared.ok) throw new Error(JSON.stringify(shared));
  return { id: created.post.id, token: shared.share.token };
}

const send = (
  token: string,
  over: Partial<{ name: string; body: string; lang: "en" | "fr" }> = {},
) =>
  addFeedback(
    db,
    { token, name: "Ada", body: "Lovely, but cut the intro.", lang: "en", ...over },
    { maxWords: 300 },
  );

describe("feedbackErrors and feedbackMaxWords", () => {
  it("needs a name of at most 80 characters and some text within the limit", () => {
    expect(feedbackErrors({ name: " ", body: " " }, 5)).toEqual({
      name: "name-required",
      body: "body-required",
    });
    expect(
      feedbackErrors({ name: "x".repeat(81), body: "one two three" }, 2),
    ).toEqual({ name: "name-long", body: "body-long" });
    expect(feedbackErrors({ name: "Ada", body: "one two" }, 2)).toEqual({});
  });

  it("reads DRAFT_FEEDBACK_MAX_WORDS, or 300", () => {
    expect(feedbackMaxWords({})).toBe(300);
    expect(feedbackMaxWords({ DRAFT_FEEDBACK_MAX_WORDS: "150" })).toBe(150);
    expect(feedbackMaxWords({ DRAFT_FEEDBACK_MAX_WORDS: "nope" })).toBe(300);
    expect(feedbackMaxWords({ DRAFT_FEEDBACK_MAX_WORDS: "-3" })).toBe(300);
  });
});

describe("addFeedback", () => {
  it("stores trimmed feedback for a shared draft, unread", async () => {
    const { id, token } = await sharedDraft();
    const result = await send(token, {
      name: "  Ada  ",
      body: "  Cut the intro.  ",
      lang: "fr",
    });
    expect(result).toMatchObject({
      ok: true,
      post: { id, title: "A draft" },
      feedback: { name: "Ada", body: "Cut the intro.", lang: "fr", readAt: null },
    });
    expect(await listFeedback(db, id)).toHaveLength(1);
  });

  it("refuses bad fields without storing anything", async () => {
    const { id, token } = await sharedDraft();
    expect(await send(token, { name: "", body: "" })).toEqual({
      ok: false,
      status: 422,
      error: "invalid",
      fields: { name: "name-required", body: "body-required" },
    });
    expect(await listFeedback(db, id)).toEqual([]);
  });

  it("refuses a link that is unknown, turned off, renewed, or a published post's", async () => {
    expect(await send("not-a-token")).toMatchObject({ status: 404 });
    expect(await send("a".repeat(43))).toMatchObject({ status: 404 });

    const a = await sharedDraft("a");
    await unsharePost(db, a.id);
    expect(await send(a.token)).toMatchObject({ error: "not-shared" });

    const b = await sharedDraft("b");
    await sharePost(db, b.id, { renew: true });
    expect(await send(b.token)).toMatchObject({ error: "not-shared" });

    const c = await sharedDraft("c");
    await updatePost(db, c.id, { status: "published" });
    expect(await send(c.token)).toMatchObject({ error: "not-shared" });
  });
});

describe("the owner's side", () => {
  it("lists newest first, marks read, deletes, and counts unread in the posts list", async () => {
    const { id, token } = await sharedDraft();
    const first = await send(token, { body: "First." });
    const second = await send(token, { body: "Second." });
    if (!first.ok || !second.ok) throw new Error("send failed");

    expect((await listFeedback(db, id)).map((item) => item.body)).toEqual([
      "Second.",
      "First.",
    ]);
    expect((await listPosts(db))[0].unreadFeedback).toBe(2);

    expect(await markFeedbackRead(db, id, [first.feedback.id])).toBe(1);
    expect(await markFeedbackRead(db, id, [first.feedback.id])).toBe(0);
    expect((await listPosts(db))[0].unreadFeedback).toBe(1);
    expect(await markFeedbackRead(db, id, "all")).toBe(1);
    expect(
      (await listFeedback(db, id)).every((item) => item.readAt !== null),
    ).toBe(true);
    expect(await markFeedbackRead(db, id, [])).toBe(0);

    expect(await deleteFeedback(db, id, second.feedback.id)).toBe(true);
    expect(await deleteFeedback(db, id, second.feedback.id)).toBe(false);
    expect(await listFeedback(db, id)).toHaveLength(1);
  });

  it("only touches the post's own feedback", async () => {
    const a = await sharedDraft("a");
    const b = await sharedDraft("b");
    const sent = await send(a.token);
    if (!sent.ok) throw new Error("send failed");
    expect(await markFeedbackRead(db, b.id, [sent.feedback.id])).toBe(0);
    expect(await deleteFeedback(db, b.id, sent.feedback.id)).toBe(false);
    expect(await listFeedback(db, a.id)).toHaveLength(1);
  });

  it("keeps feedback when sharing stops, and drops it with the post", async () => {
    const { id, token } = await sharedDraft();
    await send(token);
    await unsharePost(db, id);
    expect(await listFeedback(db, id)).toHaveLength(1);
    await deletePost(db, id);
    expect(await db.select().from(schema.blogDraftFeedback)).toEqual([]);
  });
});

describe("buildFeedbackEmail", () => {
  it("names the draft and the sender, escapes HTML and links to the Feedback tab", () => {
    const mail = buildFeedbackEmail(
      {
        postTitle: "Clasync <update>",
        editorUrl: "https://admin.example/blog/7?tab=feedback",
        name: "Ada\nLovelace",
        body: "Use <b>less</b> jargon.",
      },
      { to: "owner@example.com" },
    );
    expect(mail.to).toEqual(["owner@example.com"]);
    expect(mail.subject).toBe(
      "[Blog] Feedback on your draft “Clasync <update>” from Ada Lovelace",
    );
    expect(mail.text).toContain("https://admin.example/blog/7?tab=feedback");
    expect(mail.html).toContain("Use &lt;b&gt;less&lt;/b&gt; jargon.");
    expect(mail.html).not.toContain("<b>less</b>");
  });
});
