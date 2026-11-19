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
  await db.delete(schema.designPieces);
  await db.delete(schema.creativeFaqs);
  await db.delete(schema.creativesSettings);
  await db.delete(schema.newsletterSettings);
  await db.delete(schema.agentActivity);
  await db.delete(schema.agentTokens);
});

const piece = (title: string, slug: string) => ({
  title,
  slug,
  category: "Brand identity",
  coverUrl: "https://res.cloudinary.com/x/image/upload/c.webp",
  coverWidth: 1600,
  coverHeight: 1200,
  coverAlt: "The logo on a card",
});

describe("the creatives lists (13b.5)", () => {
  it("has the generated tools for each list, by scope", async () => {
    const { client } = await connectAs(db, [
      "read",
      "write",
      "publish",
      "delete",
    ]);
    const names = (await client.listTools()).tools.map((t) => t.name);
    for (const r of [
      "design_pieces",
      "photo_events",
      "creative_services",
      "creative_faqs",
    ])
      for (const verb of [
        "list",
        "get",
        "create",
        "update",
        "delete",
        "reorder",
      ])
        expect(names, `${r}_${verb}`).toContain(`${r}_${verb}`);
    expect(names).toContain("design_pieces_set_published");
    for (const tool of [
      "creatives_settings_get",
      "creatives_settings_update",
      "newsletter_settings_get",
      "newsletter_settings_update",
    ])
      expect(names).toContain(tool);

    const read = (
      await (await connectAs(db, ["read"])).client.listTools()
    ).tools.map((t) => t.name);
    expect(read).toContain("design_pieces_list");
    expect(read).toContain("newsletter_settings_get");
    expect(read).not.toContain("design_pieces_create");
    expect(read).not.toContain("creatives_settings_update");
  });

  it("adds a piece unpublished, publishes it only with publish, and deletes by name", async () => {
    const writer = await connectAs(db, ["read", "write"]);
    const a = await writer.call("design_pieces_create", {
      data: piece("Acme identity", "acme"),
    });
    expect(a.error, a.text).toBe(false);
    expect(a.data).toMatchObject({
      title: "Acme identity",
      isPublished: false,
    });
    expect(
      (
        await writer.call("design_pieces_update", {
          id: a.data.id,
          data: { isPublished: true },
        })
      ).text,
    ).toMatch(/publish scope/);

    const publisher = await connectAs(db, ["read", "write", "publish"]);
    expect(
      (
        await publisher.call("design_pieces_set_published", {
          id: a.data.id,
          published: true,
        })
      ).data.isPublished,
    ).toBe(true);

    const deleter = await connectAs(db, ["read", "delete"]);
    expect(
      (
        await deleter.call("design_pieces_delete", {
          id: a.data.id,
          confirm: "acme",
        })
      ).error,
    ).toBe(true);
    expect(
      (
        await deleter.call("design_pieces_delete", {
          id: a.data.id,
          confirm: "Acme identity",
        })
      ).data,
    ).toEqual({ deleted: "Acme identity" });
  });

  it("names a FAQ by its question", async () => {
    const { call } = await connectAs(db, ["read", "write"]);
    const q = await call("creative_faqs_create", {
      data: {
        question: "Do you travel?",
        answer: "Yes.",
        groupName: "photography",
      },
    });
    expect(q.error, q.text).toBe(false);
    expect((await call("creative_faqs_get", { id: q.data.id })).text).toContain(
      "Do you travel?",
    );
  });
});

describe("the settings (13b.5)", () => {
  it("reads and changes the creatives wording, merging French", async () => {
    const { call } = await connectAs(db, ["read", "write"]);
    const before = await call("creatives_settings_get");
    expect(before.error, before.text).toBe(false);
    expect(typeof before.data.heroStatement).toBe("string");

    const changed = await call("creatives_settings_update", {
      data: {
        heroLine: "Design and photography by Chestly.",
        translations: { fr: { heroLine: "Design et photo." } },
      },
    });
    expect(changed.error, changed.text).toBe(false);
    await call("creatives_settings_update", {
      data: { translations: { fr: { heroStatement: "Bonjour" } } },
    });
    const after = (await call("creatives_settings_get")).data;
    expect(after.heroLine).toBe("Design and photography by Chestly.");
    expect(after.translations.fr).toEqual({
      heroLine: "Design et photo.",
      heroStatement: "Bonjour",
    });
    expect(
      (await call("creatives_settings_update", { data: { nonsense: 1 } }))
        .error,
    ).toBe(true);
  });

  it("changes the newsletter wording, and turns it on only with publish", async () => {
    const writer = await connectAs(db, ["read", "write"]);
    expect(
      (
        await writer.call("newsletter_settings_update", {
          data: { enabled: false, boxTitle: "Get new posts" },
        })
      ).error,
    ).toBe(false);
    const on = await writer.call("newsletter_settings_update", {
      data: { enabled: true },
    });
    expect(on.error).toBe(true);
    expect(on.text).toMatch(/publish scope/);
    expect((await writer.call("newsletter_settings_get")).data).toMatchObject({
      enabled: false,
      boxTitle: "Get new posts",
    });

    const publisher = await connectAs(db, ["read", "write", "publish"]);
    expect(
      (
        await publisher.call("newsletter_settings_update", {
          data: { enabled: true },
        })
      ).data.enabled,
    ).toBe(true);
    // Already on: sending `enabled: true` again is not turning it on.
    expect(
      (
        await writer.call("newsletter_settings_update", {
          data: { enabled: true, boxTitle: "New posts" },
        })
      ).error,
    ).toBe(false);
  });
});
