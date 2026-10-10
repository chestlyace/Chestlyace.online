import { PGlite } from "@electric-sql/pglite";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { beforeEach, describe, expect, it } from "vitest";
import * as schema from "@/db/schema";
import { seed } from "@/db/seed";
import {
  createRow,
  getCreativesSettings,
  getNewsletter,
  getProfile,
  getRow,
  updateCreativesSettings,
  updateNewsletter,
  updateProfile,
  updateRow,
} from "@/lib/admin/api";
import {
  adminConfig,
  emptyFrenchValues,
  englishValues,
  frenchFields,
  frenchStatus,
  frenchValues,
  toValues,
  translatableNames,
  translationsBody,
  validate,
  type AdminRow,
} from "@/lib/admin/config";
import { fieldErrors, serviceSchema } from "@/lib/admin/schemas";
import { getHomepageData, getProjectBySlug, type Database } from "@/lib/db";
import { TRANSLATABLE, translatableFields } from "./translatable";

let db: Database;
beforeEach(async () => {
  const fresh = drizzle(new PGlite(), { schema });
  await migrate(fresh, { migrationsFolder: "db/migrations" });
  db = fresh;
  await seed(db);
});

describe("which fields are translatable", () => {
  it("names the fields of each resource, and none for the others", () => {
    expect(translatableFields("services")).toEqual([
      "title",
      "description",
      "items",
    ]);
    expect(translatableFields("projects")).toContain("problem");
    expect(translatableFields("skills")).toEqual([]);
    expect(translatableFields("socials")).toEqual([]);
  });

  it("only lists fields that exist as columns or settings", () => {
    // The tables' columns, so a typo in the list cannot slip through.
    const columns: Record<string, object> = {
      profile: schema.profile,
      services: schema.services,
      projects: schema.projects,
      journey: schema.journey,
      volunteering: schema.volunteering,
      certifications: schema.certifications,
      faqs: schema.faqs,
      "design-pieces": schema.designPieces,
      "photo-events": schema.photoEvents,
      "creative-services": schema.creativeServices,
      "creative-faqs": schema.creativeFaqs,
      "creatives-settings": schema.creativesSettings,
      newsletter: schema.newsletterSettings,
      "blog-posts": schema.blogPosts,
    };
    for (const [resource, fields] of Object.entries(TRANSLATABLE)) {
      for (const field of Object.keys(fields)) {
        expect(
          Object.hasOwn(columns[resource], field),
          `${resource}.${field}`,
        ).toBe(true);
      }
    }
  });
});

describe("the admin API", () => {
  it("accepts a French version, trims it, drops blanks and refuses other fields", () => {
    const base = {
      title: "Web design",
      description: "Pages.",
      icon: "Category",
      items: [],
      isPublished: true,
    };
    const ok = serviceSchema.safeParse({
      ...base,
      translations: {
        fr: { title: "  Création web ", description: "  ", items: ["a", ""] },
      },
    });
    expect(ok.success).toBe(true);
    expect(ok.data?.translations).toEqual({
      fr: { title: "Création web", items: ["a"] },
    });
    // a field that is not translatable
    const bad = serviceSchema.safeParse({
      ...base,
      translations: { fr: { icon: "Home" } },
    });
    expect(bad.success).toBe(false);
    // a language that does not exist
    expect(
      serviceSchema.safeParse({ ...base, translations: { de: { title: "x" } } })
        .success,
    ).toBe(false);
  });

  it("names the French field in an error", () => {
    const result = serviceSchema.safeParse({
      title: "T",
      description: "D",
      icon: "Category",
      items: [],
      isPublished: true,
      translations: { fr: { title: "x".repeat(400) } },
    });
    expect(result.success).toBe(false);
    if (!result.success)
      expect(Object.keys(fieldErrors(result.error))).toEqual(["fr:title"]);
  });

  it("stores and returns the French of a list entry", async () => {
    const made = await createRow(db, "services", {
      title: "Web",
      description: "Sites.",
      icon: "Category",
      items: ["Fast"],
      translations: { fr: { title: "Web FR", items: ["Rapide"] } },
    });
    expect(made.ok).toBe(true);
    if (!made.ok) return;
    const row = await getRow(db, "services", made.row.id);
    expect(row?.translations).toEqual({
      fr: { title: "Web FR", items: ["Rapide"] },
    });
    // an update that does not mention it leaves it alone
    await updateRow(db, "services", made.row.id, { title: "Web 2" });
    const again = await getRow(db, "services", made.row.id);
    expect(again?.translations).toEqual({
      fr: { title: "Web FR", items: ["Rapide"] },
    });
    // and one that sends it replaces it
    await updateRow(db, "services", made.row.id, {
      translations: { fr: { title: "Web 3" } },
    });
    const replaced = await getRow(db, "services", made.row.id);
    expect(replaced?.translations).toEqual({
      fr: { title: "Web 3" },
    });
  });

  it("stores the French of the profile and of the two settings rows", async () => {
    const profile = await updateProfile(db, {
      translations: {
        fr: { headline: "Ingénierie logicielle", resumeUrl: "cv.pdf" },
      },
    });
    expect(profile.ok).toBe(true);
    expect((await getProfile(db))?.translations).toEqual({
      fr: { headline: "Ingénierie logicielle", resumeUrl: "cv.pdf" },
    });
    await updateNewsletter(db, {
      translations: { fr: { boxTitle: "Nouveaux articles" } },
    });
    expect((await getNewsletter(db)).translations.fr?.boxTitle).toBe(
      "Nouveaux articles",
    );
    await updateCreativesSettings(db, {
      translations: { fr: { marqueeWords: ["Design", "Photographie"] } },
    });
    expect(
      (await getCreativesSettings(db)).translations.fr?.marqueeWords,
    ).toEqual(["Design", "Photographie"]);
  });
});

describe("public reads in a language", () => {
  it("give English as it was, and French where there is some", async () => {
    await db
      .update(schema.profile)
      .set({
        translations: {
          fr: {
            headline: "Ingénieur logiciel",
            aboutBody: "  ",
            resumeUrl: "cv-fr.pdf",
          },
        },
      })
      .where(eq(schema.profile.id, 1));
    const [project] = await db.select().from(schema.projects).limit(1);
    await db
      .update(schema.projects)
      .set({ translations: { fr: { title: "Titre FR" } } })
      .where(eq(schema.projects.id, project.id));

    const en = await getHomepageData(db);
    const fr = await getHomepageData(db, "fr");
    expect(en.profile?.headline).not.toBe("Ingénieur logiciel");
    expect(fr.profile?.headline).toBe("Ingénieur logiciel");
    expect(fr.profile?.resumeUrl).toBe("cv-fr.pdf");
    // blank French falls back to the English
    expect(fr.profile?.aboutBody).toBe(en.profile?.aboutBody);
    // what is not translated is the same
    expect(fr.profile?.email).toBe(en.profile?.email);
    expect(fr.skills).toEqual(en.skills);
    expect(fr.projects.find((p) => p.id === project.id)?.title).toBe(
      "Titre FR",
    );
    expect(en.projects.find((p) => p.id === project.id)?.title).toBe(
      project.title,
    );

    const page = await getProjectBySlug(project.slug, db, "fr");
    expect(page?.project.title).toBe("Titre FR");
  });
});

describe("the admin's editors", () => {
  const services = adminConfig("services")!;

  it("have French fields only where the editor supports them", () => {
    expect(translatableNames(services)).toEqual([
      "title",
      "description",
      "items",
    ]);
    expect(translatableNames(adminConfig("skills")!)).toEqual([]);
    // the creatives' pieces and events have their own editors (11b.5)
    expect(translatableNames(adminConfig("design")!)).toEqual([]);
    expect(translatableNames(adminConfig("experience")!)).toContain("role");
    expect(translatableNames(adminConfig("profile")!)).toContain("resumeUrl");
  });

  it("read the French from a row and write it back as translations", () => {
    const row = {
      id: 1,
      title: "Web",
      description: "Sites.",
      icon: "Category",
      items: ["Fast"],
      isPublished: true,
      translations: { fr: { title: "Web FR", items: ["Rapide", ""] } },
    } as AdminRow;
    const values = toValues(services, row);
    expect(values["fr:title"]).toBe("Web FR");
    expect(values["fr:description"]).toBe("");
    expect(values["fr:items"]).toEqual(["Rapide", ""]);
    expect(englishValues(values)["fr:title"]).toBeUndefined();
    expect(frenchValues(values)).toEqual({
      title: "Web FR",
      items: ["Rapide"],
    });
    expect(translationsBody(values)).toEqual({
      fr: { title: "Web FR", items: ["Rapide"] },
    });
    expect(emptyFrenchValues(services)).toEqual({
      "fr:title": "",
      "fr:description": "",
      "fr:items": [],
    });
  });

  it("show the English as the placeholder and ask for nothing", () => {
    const fields = frenchFields(services, {
      title: "Web",
      description: "Long   text",
    });
    const title = fields.find((f) => f.name === "fr:title");
    expect(title).toMatchObject({
      type: "text",
      optional: true,
      placeholder: "Web",
    });
    expect(fields.find((f) => f.name === "fr:description")).toMatchObject({
      type: "long",
      placeholder: "Long text",
    });
  });

  it("check the French's length, not its presence", () => {
    const row = {
      id: 1,
      title: "Web",
      description: "S",
      icon: "Category",
      items: [],
      isPublished: true,
    } as AdminRow;
    const values = toValues(services, row);
    expect(validate(services, values)).toEqual({});
    expect(
      validate(services, { ...values, "fr:title": "x".repeat(301) })[
        "fr:title"
      ],
    ).toMatch(/under 300/);
  });

  it("say whether an entry's French is complete", () => {
    const base = { id: 1, title: "Web", description: "Sites", items: ["a"] };
    expect(frenchStatus(services, { ...base } as AdminRow)).toBe("missing");
    expect(
      frenchStatus(services, {
        ...base,
        translations: { fr: { title: "W", description: "S", items: ["a"] } },
      } as AdminRow),
    ).toBe("done");
    expect(
      frenchStatus(services, {
        ...base,
        translations: { fr: { title: "W" } },
      } as AdminRow),
    ).toBe("missing");
    // nothing to translate is complete
    expect(
      frenchStatus(services, {
        id: 1,
        title: "",
        description: "",
        items: [],
      } as AdminRow),
    ).toBe("done");
    expect(
      frenchStatus(adminConfig("skills")!, { id: 1, name: "x" } as AdminRow),
    ).toBe("none");
  });
});
