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
  await db.delete(schema.skills);
  await db.delete(schema.projects);
  await db.delete(schema.agentActivity);
  await db.delete(schema.agentTokens);
});

const skill = (name: string, extra: object = {}) => ({
  name,
  category: "framework",
  iconSlug: "react",
  ...extra,
});

describe("tools for the lists", () => {
  it("exists for every resource, each by the scope it needs", async () => {
    const { client } = await connectAs(db, [
      "read",
      "write",
      "publish",
      "delete",
    ]);
    const names = (await client.listTools()).tools.map((t) => t.name);
    for (const r of [
      "projects",
      "skills",
      "journey",
      "volunteering",
      "certifications",
      "services",
      "faqs",
      "socials",
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
    expect(names).not.toContain("socials_set_published");
    expect(names).toContain("projects_set_published");
    expect(names).toContain("profile_update");
    const read = (
      await (await connectAs(db, ["read"])).client.listTools()
    ).tools.map((t) => t.name);
    expect(read).toContain("projects_list");
    expect(read).not.toContain("projects_create");
  });

  it("adds an item unpublished, lists, reads, changes and reorders it", async () => {
    const { call } = await connectAs(db, ["read", "write"]);
    const a = await call("skills_create", { data: skill("React") });
    expect(a.data).toMatchObject({ name: "React", isPublished: false });
    const b = await call("skills_create", { data: skill("Vue") });
    expect(
      (await call("skills_list")).data.items.map(
        (i: { name: string }) => i.name,
      ),
    ).toEqual(["React", "Vue"]);
    await call("skills_update", { id: a.data.id, data: { name: "React JS" } });
    expect((await call("skills_get", { id: a.data.id })).data.name).toBe(
      "React JS",
    );
    await call("skills_reorder", { ids: [b.data.id, a.data.id] });
    expect((await call("skills_list")).data.items[0].name).toBe("Vue");
  });

  it("reports what is wrong with a field, an unknown id, and a nothing-to-change update", async () => {
    const { call } = await connectAs(db, ["read", "write"]);
    const bad = await call("skills_create", {
      data: skill("", { category: "x" }),
    });
    expect(bad.error).toBe(true);
    expect(bad.text).toMatch(/name/);
    expect((await call("skills_get", { id: 9999 })).text).toMatch(
      /skills_list/,
    );
    expect(
      (await call("skills_update", { id: 9999, data: { name: "x" } })).error,
    ).toBe(true);
    const a = await call("skills_create", { data: skill("React") });
    expect(
      (await call("skills_update", { id: a.data.id, data: {} })).error,
    ).toBe(true);
  });

  it("puts things live only with the publish scope", async () => {
    const writer = await connectAs(db, ["read", "write"]);
    const refused = await writer.call("skills_create", {
      data: skill("Live", { isPublished: true }),
    });
    expect(refused.error).toBe(true);
    expect(refused.text).toMatch(/publish scope/);
    const a = await writer.call("skills_create", { data: skill("React") });
    const sneaky = await writer.call("skills_update", {
      id: a.data.id,
      data: { isPublished: true },
    });
    expect(sneaky.error).toBe(true);
    // an unchanged value is not a change
    expect(
      (
        await writer.call("skills_update", {
          id: a.data.id,
          data: { isPublished: false, name: "R" },
        })
      ).error,
    ).toBe(false);
    const publisher = await connectAs(db, ["read", "write", "publish"]);
    const live = await publisher.call("skills_set_published", {
      id: a.data.id,
      published: true,
    });
    expect(live.data.isPublished).toBe(true);
    await publisher.call("skills_set_published", {
      id: a.data.id,
      published: false,
    });
    expect(
      (await publisher.call("skills_get", { id: a.data.id })).data.isPublished,
    ).toBe(false);
  });

  it("deletes only when the name is repeated", async () => {
    const writer = await connectAs(db, ["read", "write"]);
    const a = await writer.call("skills_create", { data: skill("React") });
    const { call } = await connectAs(db, ["read", "delete"]);
    const wrong = await call("skills_delete", {
      id: a.data.id,
      confirm: "react",
    });
    expect(wrong.error).toBe(true);
    expect(wrong.text).toContain('"React"');
    expect((await call("skills_list")).data.items).toHaveLength(1);
    expect(
      (await call("skills_delete", { id: a.data.id, confirm: "React" })).data,
    ).toEqual({
      deleted: "React",
    });
    expect((await call("skills_list")).data.items).toHaveLength(0);
  });

  it("merges French text into what is there", async () => {
    const { call } = await connectAs(db, ["read", "write"]);
    const p = await call("projects_create", {
      data: {
        title: "Acme",
        slug: "acme",
        summary: "Short",
        description: "Long",
        translations: { fr: { title: "Acme FR", summary: "Court" } },
      },
    });
    expect(p.error, p.text).toBe(false);
    await call("projects_update", {
      id: p.data.id,
      data: { translations: { fr: { summary: "Très court" } } },
    });
    expect(
      (await call("projects_get", { id: p.data.id })).data.translations.fr,
    ).toEqual({
      title: "Acme FR",
      summary: "Très court",
    });
  });
});

describe("the profile", () => {
  it("is read and changed in place, and logged", async () => {
    await db.delete(schema.profile);
    const { call } = await connectAs(db, ["read", "write"]);
    expect((await call("profile_get")).error).toBe(true);
    expect(
      (await call("profile_update", { data: { nonsense: 1 } })).error,
    ).toBe(true);
  });
});
