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
  await db.delete(schema.newsletterSettings);
  await db.delete(schema.creativesSettings);
  await db.delete(schema.agentActivity);
  await db.delete(schema.agentTokens);
});

const piece = (extra: object = {}) => ({
  title: "Acme",
  slug: "acme",
  category: "Brand identity",
  coverUrl: "https://res.cloudinary.com/x/image/upload/c.webp",
  coverWidth: 2400,
  coverHeight: 1600,
  coverAlt: "A card",
  ...extra,
});

describe("creatives tools", () => {
  it("has the four lists and the two settings, by scope", async () => {
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
        "set_published",
        "delete",
        "reorder",
      ])
        expect(names, `${r}_${verb}`).toContain(`${r}_${verb}`);
    for (const n of [
      "creatives_settings_get",
      "creatives_settings_update",
      "newsletter_settings_get",
      "newsletter_settings_update",
    ])
      expect(names).toContain(n);
    const read = (
      await (await connectAs(db, ["read"])).client.listTools()
    ).tools.map((t) => t.name);
    expect(read).toEqual(
      expect.arrayContaining(["design_pieces_list", "newsletter_settings_get"]),
    );
    expect(read).not.toContain("newsletter_settings_update");
  });

  it("adds a design piece unpublished, publishes it with the publish scope, deletes it by title", async () => {
    const writer = await connectAs(db, ["read", "write"]);
    const created = await writer.call("design_pieces_create", {
      data: piece(),
    });
    expect(created.error, created.text).toBe(false);
    expect(created.data.isPublished).toBe(false);
    expect(
      (
        await writer.call("design_pieces_create", {
          data: piece({ slug: "b", isPublished: true }),
        })
      ).text,
    ).toMatch(/publish scope/);
    const publisher = await connectAs(db, [
      "read",
      "write",
      "publish",
      "delete",
    ]);
    expect(
      (
        await publisher.call("design_pieces_set_published", {
          id: created.data.id,
          published: true,
        })
      ).data.isPublished,
    ).toBe(true);
    expect(
      (
        await publisher.call("design_pieces_delete", {
          id: created.data.id,
          confirm: "x",
        })
      ).error,
    ).toBe(true);
    await publisher.call("design_pieces_delete", {
      id: created.data.id,
      confirm: "Acme",
    });
    expect(
      (await publisher.call("design_pieces_list")).data.items,
    ).toHaveLength(0);
  });

  it("reads the creatives wording in use and merges French changes", async () => {
    const { call } = await connectAs(db, ["read", "write"]);
    const first = await call("creatives_settings_get");
    expect(first.data.heroStatement).toBeTruthy();
    const a = await call("creatives_settings_update", {
      data: {
        heroStatement: "Made well",
        translations: { fr: { heroStatement: "Bien fait" } },
      },
    });
    expect(a.error, a.text).toBe(false);
    await call("creatives_settings_update", {
      data: { translations: { fr: { heroLine: "Une ligne" } } },
    });
    const fr = (await call("creatives_settings_get")).data.translations.fr;
    expect(fr).toMatchObject({
      heroStatement: "Bien fait",
      heroLine: "Une ligne",
    });
    expect(
      (await call("creatives_settings_update", { data: { heroStatement: "" } }))
        .error,
    ).toBe(true);
  });

  it("changes the newsletter's wording but not its switch without publish", async () => {
    const writer = await connectAs(db, ["read", "write"]);
    const before = (await writer.call("newsletter_settings_get")).data;
    const wording = await writer.call("newsletter_settings_update", {
      data: { boxTitle: "Join the list" },
    });
    expect(wording.error, wording.text).toBe(false);
    expect(wording.data.boxTitle).toBe("Join the list");
    const flip = await writer.call("newsletter_settings_update", {
      data: { enabled: !before.enabled },
    });
    expect(flip.error).toBe(true);
    expect(flip.text).toMatch(/publish scope/);
    const same = await writer.call("newsletter_settings_update", {
      data: { enabled: before.enabled },
    });
    expect(same.error).toBe(false);
    const publisher = await connectAs(db, ["read", "write", "publish"]);
    const done = await publisher.call("newsletter_settings_update", {
      data: { enabled: !before.enabled },
    });
    expect(done.data.enabled).toBe(!before.enabled);
  });
});
