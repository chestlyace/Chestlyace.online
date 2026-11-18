import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import * as schema from "@/db/schema";
import { createPost, deletePost, updatePost } from "@/lib/admin/blogApi";
import { sharePost, unsharePost } from "@/lib/admin/shareApi";
import type { Database } from "@/lib/db";
import { getPublishedPost, listPublishedPosts } from "./data";
import { getSharedDraft } from "./drafts";

let db: Database;
beforeAll(async () => {
  const fresh = drizzle(new PGlite(), { schema });
  await migrate(fresh, { migrationsFolder: "db/migrations" });
  db = fresh;
}, 30_000);

beforeEach(async () => {
  await db.delete(schema.blogPosts);
});

async function sharedDraft(over: Record<string, unknown> = {}) {
  const created = await createPost(db, {
    title: "Clasync update",
    slug: "clasync-update",
    description: "What changed",
    content: "## One\n\nHello there.",
    tags: ["clasync"],
    ...over,
  });
  if (!created.ok) throw new Error(JSON.stringify(created));
  const shared = await sharePost(db, created.post.id);
  if (!shared.ok) throw new Error(JSON.stringify(shared));
  return { post: created.post, token: shared.share.token };
}

describe("getSharedDraft", () => {
  it("opens the draft with its saved text and no published date", async () => {
    const { token } = await sharedDraft();
    const result = await getSharedDraft(db, token);
    expect(result).toMatchObject({
      kind: "draft",
      post: {
        slug: "clasync-update",
        title: "Clasync update",
        description: "What changed",
        content: "## One\n\nHello there.",
        tags: ["clasync"],
        publishedAt: null,
        canonicalUrl: null,
        lang: "en",
        readingMinutes: 1,
      },
    });
    if (result?.kind !== "draft") return;
    expect(result.post.updatedAt).toMatch(/^\d{4}-\d\d-\d\dT/);
  });

  it("shows the last saved version", async () => {
    const { post, token } = await sharedDraft();
    await updatePost(db, post.id, { content: "Rewritten." });
    const result = await getSharedDraft(db, token);
    expect(result?.kind === "draft" && result.post.content).toBe("Rewritten.");
  });

  it("stays out of every public read", async () => {
    await sharedDraft();
    expect(await listPublishedPosts(db)).toEqual([]);
    expect(await getPublishedPost(db, "clasync-update")).toBeNull();
  });

  it("sends a published post's link to the post", async () => {
    const { post, token } = await sharedDraft();
    await updatePost(db, post.id, { status: "published" });
    expect(await getSharedDraft(db, token)).toEqual({
      kind: "published",
      slug: "clasync-update",
      lang: "en",
    });
    // Unpublished again, the same link shows the draft again.
    await updatePost(db, post.id, { status: "draft" });
    expect((await getSharedDraft(db, token))?.kind).toBe("draft");
  });

  it("opens nothing for an unknown, renewed, turned-off or deleted link", async () => {
    expect(await getSharedDraft(db, "a".repeat(43))).toBeNull();
    expect(await getSharedDraft(db, "not-a-token")).toBeNull();

    const { post, token } = await sharedDraft();
    const renewed = await sharePost(db, post.id, { renew: true });
    if (!renewed.ok) throw new Error("renew failed");
    expect(await getSharedDraft(db, token)).toBeNull();
    expect(await getSharedDraft(db, renewed.share.token)).not.toBeNull();

    await unsharePost(db, post.id);
    expect(await getSharedDraft(db, renewed.share.token)).toBeNull();

    const other = await sharedDraft({ slug: "other" });
    await deletePost(db, other.post.id);
    expect(await getSharedDraft(db, other.token)).toBeNull();
  });

  it("reads French when the post has a published French version", async () => {
    const { token } = await sharedDraft({
      translations: {
        fr: {
          title: "Mise à jour de Clasync",
          content: "Bonjour.",
          published: true,
        },
      },
    });
    expect(await getSharedDraft(db, token, "fr")).toMatchObject({
      kind: "draft",
      post: {
        lang: "fr",
        title: "Mise à jour de Clasync",
        content: "Bonjour.",
      },
    });
    const en = await getSharedDraft(db, token, "en");
    expect(en?.kind === "draft" && en.post.content).toBe(
      "## One\n\nHello there.",
    );
  });

  it("reads English on the French page while French is switched off", async () => {
    const { token } = await sharedDraft({
      translations: { fr: { content: "Bonjour.", published: false } },
    });
    expect(await getSharedDraft(db, token, "fr")).toMatchObject({
      kind: "draft",
      post: { lang: "en", content: "## One\n\nHello there." },
    });
  });
});
