import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import * as schema from "@/db/schema";
import type { Database } from "@/lib/db";
import { SERVICE_ICONS } from "@/lib/admin/serviceIcons";
import { listPublishedFaqs, listPublishedServices } from "./data";
import { servicesJsonLd } from "./seo";

let db: Database;
beforeAll(async () => {
  const instance = drizzle(new PGlite(), { schema });
  await migrate(instance, { migrationsFolder: "db/migrations" });
  db = instance;
}, 30_000);

describe("the seeded Services page", () => {
  it("starts with three design and three photography services", async () => {
    const services = await listPublishedServices(db);
    expect(services.filter((s) => s.group === "design")).toHaveLength(3);
    expect(services.filter((s) => s.group === "photography")).toHaveLength(3);
    for (const service of services) {
      expect(SERVICE_ICONS).toContain(service.icon);
      expect(service.items.length).toBeGreaterThan(0);
    }
  });

  it("starts with three questions per group", async () => {
    const faqs = await listPublishedFaqs(db);
    expect(faqs.filter((f) => f.group === "design")).toHaveLength(3);
    expect(faqs.filter((f) => f.group === "photography")).toHaveLength(3);
  });

  it("leaves unpublished rows out", async () => {
    await db
      .update(schema.creativeFaqs)
      .set({ isPublished: false })
      .where(eq(schema.creativeFaqs.groupName, "photography"));
    const faqs = await listPublishedFaqs(db);
    expect(faqs.every((f) => f.group === "design")).toBe(true);
  });

  it("reads a service and a question in French, field by field", async () => {
    const [first] = await db.select().from(schema.creativeServices).limit(1);
    await db
      .update(schema.creativeServices)
      .set({ translations: { fr: { title: "Titre", items: ["un", "deux"] } } })
      .where(eq(schema.creativeServices.id, first.id));
    const [faq] = await db.select().from(schema.creativeFaqs).limit(1);
    await db
      .update(schema.creativeFaqs)
      .set({ translations: { fr: { question: "Question ?" } } })
      .where(eq(schema.creativeFaqs.id, faq.id));
    const services = await listPublishedServices(db, "fr");
    const one = services.find((s) => s.id === first.id)!;
    expect(one.title).toBe("Titre");
    expect(one.items).toEqual(["un", "deux"]);
    expect(one.description).toBe(first.description); // not translated: English
    const faqs = await listPublishedFaqs(db, "fr");
    const q = faqs.find((f) => f.id === faq.id);
    expect(q?.question).toBe("Question ?");
    expect(q?.answer).toBe(faq.answer);
    expect(
      (await listPublishedServices(db)).find((s) => s.id === first.id)?.title,
    ).toBe(first.title);
  });

  it("describes each service and the questions as structured data", async () => {
    const services = await listPublishedServices(db);
    const faqs = await listPublishedFaqs(db);
    const data = servicesJsonLd(services, faqs, "https://example.test");
    expect(data.filter((d) => d["@type"] === "Service")).toHaveLength(6);
    const page = data.find((d) => d["@type"] === "FAQPage");
    expect(page?.mainEntity).toHaveLength(3);
    expect(servicesJsonLd(services, [])).toHaveLength(6);
  });
});
