import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { beforeEach, describe, expect, it } from "vitest";
import * as schema from "@/db/schema";
import { seed } from "@/db/seed";
import type { Database } from "@/lib/db";
import {
  createRow,
  deleteRow,
  getNewsletter,
  getProfile,
  getRow,
  isAdminApiResource,
  listRows,
  reorderRows,
  updateNewsletter,
  updateProfile,
  updateRow,
} from "./api";

let db: Database;
beforeEach(async () => {
  const fresh = drizzle(new PGlite(), { schema });
  await migrate(fresh, { migrationsFolder: "db/migrations" });
  db = fresh;
  await seed(db);
});

const ids = async (name: string) => (await listRows(db, name)).map((r) => r.id);

describe("which resources exist", () => {
  it("is every list resource; the profile is its own thing", () => {
    for (const name of [
      "skills",
      "services",
      "certifications",
      "socials",
      "faqs",
      "projects",
      "journey",
      "volunteering",
    ]) {
      expect(isAdminApiResource(name)).toBe(true);
    }
    for (const name of ["profile", "toString", "__proto__", "constructor"]) {
      expect(isAdminApiResource(name)).toBe(false);
    }
  });
});

describe("listRows / getRow", () => {
  it("lists in order, drafts included", async () => {
    await updateRow(db, "faqs", (await ids("faqs"))[0], { isPublished: false });
    const rows = await listRows(db, "faqs");
    expect(rows).toHaveLength(2);
    expect(rows[0].isPublished).toBe(false);
    expect(await getRow(db, "faqs", rows[1].id as number)).toMatchObject({
      id: rows[1].id,
    });
    expect(await getRow(db, "faqs", 9999)).toBeNull();
  });
});

describe("createRow", () => {
  it("adds to the end and starts unpublished", async () => {
    const before = await listRows(db, "skills");
    const result = await createRow(db, "skills", {
      name: " Rust ",
      category: "language",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.row).toMatchObject({
      name: "Rust",
      isPublished: false,
      iconSlug: null,
    });
    const after = await listRows(db, "skills");
    expect(after).toHaveLength(before.length + 1);
    expect(after.at(-1)?.id).toBe(result.row.id);
    expect(Number(after.at(-1)?.orderIndex)).toBe(
      Number(before.at(-1)?.orderIndex) + 1,
    );
  });

  it("socials have no published flag", async () => {
    const result = await createRow(db, "socials", {
      platform: "Mastodon",
      url: "https://m.test/@x",
      icon: "link",
      showOn: ["main"],
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.row).not.toHaveProperty("isPublished");
  });

  it("refuses bad bodies with a message per field, and unknown fields", async () => {
    const bad = await createRow(db, "services", { title: "", icon: "Nope" });
    expect(bad).toMatchObject({ ok: false, status: 422 });
    if (!bad.ok && bad.status === 422) {
      expect(Object.keys(bad.fields).sort()).toEqual([
        "description",
        "icon",
        "title",
      ]);
    }
    const extra = await createRow(db, "faqs", {
      question: "Q",
      answer: "A",
      order_index: 1,
    });
    expect(extra).toMatchObject({ ok: false, status: 422 });
    expect(await createRow(db, "faqs", null)).toMatchObject({ ok: false });
  });

  it("can't inject columns", async () => {
    const result = await createRow(db, "faqs", {
      question: "Q",
      answer: "A",
      id: 999,
      createdAt: "2000-01-01",
    });
    expect(result.ok).toBe(false);
  });
});

describe("updateRow", () => {
  it("changes only what is sent", async () => {
    const [first] = await listRows(db, "services");
    expect((first.items as string[]).length).toBeGreaterThan(0);
    const result = await updateRow(db, "services", first.id, {
      title: "Changed",
    });
    // lists the body leaves out are not emptied
    expect(result).toMatchObject({
      ok: true,
      row: {
        title: "Changed",
        description: first.description,
        items: first.items,
      },
    });
  });

  it("toggles publishing", async () => {
    const [first] = await listRows(db, "skills");
    const result = await updateRow(db, "skills", first.id, {
      isPublished: false,
    });
    expect(result).toMatchObject({ ok: true, row: { isPublished: false } });
  });

  it("refuses empty and invalid updates, and unknown ids", async () => {
    const [first] = await listRows(db, "faqs");
    expect(await updateRow(db, "faqs", first.id, {})).toMatchObject({
      ok: false,
      status: 422,
    });
    expect(await updateRow(db, "faqs", first.id, { answer: "" })).toMatchObject(
      { ok: false, status: 422 },
    );
    expect(await updateRow(db, "faqs", 9999, { answer: "x" })).toEqual({
      ok: false,
      status: 404,
      error: "not-found",
    });
  });
});

describe("deleteRow", () => {
  it("deletes, once", async () => {
    const [first] = await listRows(db, "socials");
    expect(await deleteRow(db, "socials", first.id)).toEqual({ ok: true });
    expect(await deleteRow(db, "socials", first.id)).toMatchObject({
      ok: false,
      status: 404,
    });
    expect(await listRows(db, "socials")).toHaveLength(3);
  });
});

describe("reorderRows", () => {
  it("applies a full new order", async () => {
    const before = await ids("skills");
    const next = [...before].reverse();
    expect(await reorderRows(db, "skills", { ids: next })).toEqual({
      ok: true,
    });
    expect(await ids("skills")).toEqual(next);
  });

  it("reorders a subset without disturbing the rest", async () => {
    const before = await ids("skills");
    const [a, b, c] = before;
    expect(await reorderRows(db, "skills", { ids: [c, a] })).toEqual({
      ok: true,
    });
    const after = await ids("skills");
    // a and c swap places; b and everything else stay put
    expect(after[0]).toBe(c);
    expect(after[1]).toBe(b);
    expect(after[2]).toBe(a);
    expect(after.slice(3)).toEqual(before.slice(3));
  });

  it("refuses unknown ids and bad bodies", async () => {
    expect(await reorderRows(db, "skills", { ids: [1, 9999] })).toMatchObject({
      ok: false,
      status: 404,
    });
    expect(await reorderRows(db, "skills", { ids: [] })).toMatchObject({
      ok: false,
      status: 422,
    });
    expect(await reorderRows(db, "skills", { ids: "1,2" })).toMatchObject({
      ok: false,
      status: 422,
    });
  });
});

describe("projects", () => {
  const ok = {
    title: "New thing",
    slug: "new-thing",
    summary: "A summary.",
    isFeatured: false,
    isLiveUrlPrivate: false,
    isSourceUrlPrivate: true,
  };

  it("creates one with defaults, and keeps the address unique", async () => {
    const first = await createRow(db, "projects", ok);
    expect(first.ok).toBe(true);
    if (first.ok) {
      expect(first.row).toMatchObject({
        slug: "new-thing",
        isPublished: false,
        techStack: [],
        galleryUrls: [],
        isSourceUrlPrivate: true,
      });
    }
    const clash = await createRow(db, "projects", ok);
    expect(clash).toEqual({
      ok: false,
      status: 422,
      error: "invalid",
      fields: { slug: "Another project already uses that address." },
    });
    const [other] = await listRows(db, "projects");
    expect(
      await updateRow(db, "projects", other.id, { slug: "new-thing" }),
    ).toMatchObject({ ok: false, status: 422 });
  });

  it("checks the address's shape, the gallery and the links", async () => {
    for (const bad of [
      { slug: "New Thing" },
      { slug: "a--b" },
      { slug: "-a" },
      { galleryUrls: ["javascript:alert(1)"] },
      { galleryUrls: Array(13).fill("https://x.test/a.png") },
      { liveUrl: "nope" },
    ]) {
      expect(await createRow(db, "projects", { ...ok, ...bad })).toMatchObject({
        ok: false,
        status: 422,
      });
    }
    expect(
      await createRow(db, "projects", {
        ...ok,
        galleryUrls: ["https://x.test/a.png", "shots/b.png"],
        techStack: ["React", "Postgres"],
      }),
    ).toMatchObject({ ok: true });
  });
});

describe("journey and volunteering", () => {
  it("journey needs a type; volunteering has none", async () => {
    const entry = {
      role: "Dev",
      organization: "Acme",
      startDate: "2025-01-01",
    };
    expect(await createRow(db, "journey", entry)).toMatchObject({ ok: false });
    const made = await createRow(db, "journey", {
      ...entry,
      type: "education",
    });
    expect(made).toMatchObject({
      ok: true,
      row: { type: "education", endDate: null },
    });
    expect(
      await createRow(db, "volunteering", { ...entry, type: "work" }),
    ).toMatchObject({ ok: false });
    expect(await createRow(db, "volunteering", entry)).toMatchObject({
      ok: true,
    });
    expect(
      await createRow(db, "journey", {
        ...entry,
        type: "work",
        startDate: "soon",
      }),
    ).toMatchObject({ ok: false });
  });

  it("a filtered list reorders in place", async () => {
    const rows = await listRows(db, "journey");
    const education = rows
      .filter((r) => r.type === "education")
      .map((r) => r.id);
    expect(education).toHaveLength(2);
    const work = rows.filter((r) => r.type === "work").map((r) => r.id);
    await reorderRows(db, "journey", { ids: [...education].reverse() });
    const after = await listRows(db, "journey");
    // the work entries kept their places; the two education entries swapped
    expect(after.map((r) => r.id)).toEqual(
      rows.map((r) =>
        r.id === education[0]
          ? education[1]
          : r.id === education[1]
            ? education[0]
            : r.id,
      ),
    );
    expect(after.filter((r) => r.type === "work").map((r) => r.id)).toEqual(
      work,
    );
  });
});

describe("profile", () => {
  it("is read and changed as one row", async () => {
    const before = await getProfile(db);
    expect(before).toMatchObject({ id: 1, email: "chestlyace@gmail.com" });
    const result = await updateProfile(db, {
      tagline: "  Open to remote roles ",
      whatsappNumber: "+237 676 940 247",
      headlineWords: ["Backend", "Full-Stack"],
    });
    expect(result).toMatchObject({
      ok: true,
      row: {
        tagline: "Open to remote roles",
        whatsappNumber: "237676940247",
        headlineWords: ["Backend", "Full-Stack"],
        name: before?.name,
      },
    });
  });

  it("refuses bad values, unknown fields and empty updates", async () => {
    expect(await updateProfile(db, { email: "nope" })).toMatchObject({
      ok: false,
      status: 422,
    });
    expect(await updateProfile(db, { whatsappNumber: "abc" })).toMatchObject({
      ok: false,
    });
    expect(await updateProfile(db, { availability: "maybe" })).toMatchObject({
      ok: false,
    });
    expect(await updateProfile(db, { id: 2 })).toMatchObject({ ok: false });
    expect(await updateProfile(db, {})).toMatchObject({
      ok: false,
      fields: { _: "Nothing to change." },
    });
  });

  it("lets availability be cleared", async () => {
    expect(await updateProfile(db, { availability: "" })).toMatchObject({
      ok: true,
      row: { availability: null },
    });
  });
});

describe("newsletter wording", () => {
  it("reads as the built-in wording when nothing is stored, then as what was saved", async () => {
    const before = await getNewsletter(db);
    expect(before.enabled).toBe(true);
    expect(before.boxTitle).toBe("New posts, in your inbox");

    const result = await updateNewsletter(db, {
      boxTitle: "  Join the list  ",
      enabled: false,
    });
    expect(result.ok).toBe(true);
    const after = await getNewsletter(db);
    expect(after.boxTitle).toBe("Join the list");
    expect(after.enabled).toBe(false);
    expect(after.boxText).toBe(before.boxText);
    expect(await db.select().from(schema.newsletterSettings)).toHaveLength(1);

    await updateNewsletter(db, { emailSubject: "Hello" });
    const again = await getNewsletter(db);
    expect(again.emailSubject).toBe("Hello");
    expect(again.boxTitle).toBe("Join the list");
    expect(await db.select().from(schema.newsletterSettings)).toHaveLength(1);
  });

  it("refuses blank texts, too-long texts, unknown fields and an empty change", async () => {
    for (const body of [
      { boxTitle: "  " },
      { boxTitle: "x".repeat(81) },
      { emailSubject: "x".repeat(151) },
      { nope: "x" },
      { enabled: "yes" },
    ]) {
      const result = await updateNewsletter(db, body);
      expect(result).toMatchObject({ ok: false, status: 422 });
    }
    expect(await updateNewsletter(db, {})).toMatchObject({ ok: false });
    expect(await db.select().from(schema.newsletterSettings)).toHaveLength(0);
  });
});
