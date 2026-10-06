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
  getRow,
  isAdminApiResource,
  listRows,
  reorderRows,
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
  it("is the five simple ones for now", () => {
    for (const name of [
      "skills",
      "services",
      "certifications",
      "socials",
      "faqs",
    ]) {
      expect(isAdminApiResource(name)).toBe(true);
    }
    for (const name of [
      "projects",
      "profile",
      "toString",
      "__proto__",
      "constructor",
    ]) {
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
    const result = await updateRow(db, "services", first.id, {
      title: "Changed",
    });
    expect(result).toMatchObject({
      ok: true,
      row: { title: "Changed", description: first.description },
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
