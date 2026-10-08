import { PGlite } from "@electric-sql/pglite";
import { readdirSync } from "node:fs";
import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { beforeEach, describe, expect, it } from "vitest";
import * as schema from "@/db/schema";
import { seed, seedData } from "@/db/seed";
import {
  getHomepageData,
  getProjectBySlug,
  getProjectSlugs,
  type Database,
} from "@/lib/db";

// Each test gets a fresh in-process Postgres with the real migrations applied.
async function freshDb(): Promise<Database> {
  const db = drizzle(new PGlite(), { schema });
  await migrate(db, { migrationsFolder: "db/migrations" });
  return db;
}

let db: Database;
beforeEach(async () => {
  db = await freshDb();
});

describe("migrations", () => {
  it("create every table", async () => {
    const result = (await db.execute(
      sql`select table_name from information_schema.tables where table_schema = 'public' order by table_name`,
    )) as { rows: { table_name: string }[] };
    expect(result.rows.map((r) => r.table_name)).toEqual([
      "blog_likes",
      "blog_posts",
      "certifications",
      "faqs",
      "journey",
      "profile",
      "projects",
      "services",
      "skills",
      "socials",
      "volunteering",
    ]);
  });

  it("allow only one profile row (id = 1)", async () => {
    await db.insert(schema.profile).values(seedData.profile);
    await expect(
      db.insert(schema.profile).values({ ...seedData.profile, id: 2 }),
    ).rejects.toThrow();
  });

  it("reject unknown journey types, including 'volunteer'", async () => {
    const row = { role: "r", organization: "o" };
    await expect(
      db.insert(schema.journey).values({ ...row, type: "volunteer" }),
    ).rejects.toThrow();
    await db.insert(schema.journey).values({ ...row, type: "education" });
  });

  it("reject unknown skill categories and availability values", async () => {
    await expect(
      db.insert(schema.skills).values({ name: "x", category: "other" }),
    ).rejects.toThrow();
    await expect(
      db
        .insert(schema.profile)
        .values({ ...seedData.profile, availability: "busy" }),
    ).rejects.toThrow();
  });

  it("default arrays to empty and socials to all three sites", async () => {
    const [service] = await db
      .insert(schema.services)
      .values({ title: "t", description: "d", icon: "code" })
      .returning();
    expect(service.items).toEqual([]);
    const [social] = await db
      .insert(schema.socials)
      .values({ platform: "GitHub", url: "https://github.com", icon: "github" })
      .returning();
    expect(social.showOn).toEqual(["main", "creatives", "blog"]);
  });

  it("default the new columns: hero words, case-study text, gallery", async () => {
    await db.insert(schema.profile).values({
      id: 1,
      name: "n",
      headline: "h",
      email: "e@example.com",
    });
    const [profile] = await db.select().from(schema.profile);
    expect(profile.headlineWords).toEqual([]);

    const [project] = await db
      .insert(schema.projects)
      .values({ slug: "p", title: "P", summary: "s" })
      .returning();
    expect(project).toMatchObject({
      problem: null,
      approach: null,
      outcome: null,
      galleryUrls: [],
    });
  });

  it("keep certification dates and links optional", async () => {
    const [cert] = await db
      .insert(schema.certifications)
      .values({ name: "Gemini in Gmail", issuer: "Google Workspace" })
      .returning();
    expect(cert).toMatchObject({
      issuedOn: null,
      badgeUrl: null,
      credentialUrl: null,
      isPublished: true,
    });
    await expect(
      db.insert(schema.certifications).values({ name: "no issuer" } as never),
    ).rejects.toThrow();
  });

  it("refresh updated_at on every update via the trigger", async () => {
    const [row] = await db
      .insert(schema.faqs)
      .values({
        question: "q",
        answer: "a",
        updatedAt: new Date("2000-01-01T00:00:00Z"),
      })
      .returning();
    const [updated] = await db
      .update(schema.faqs)
      .set({ answer: "changed" })
      .where(eq(schema.faqs.id, row.id))
      .returning();
    expect(updated.updatedAt.getTime()).toBeGreaterThan(
      new Date("2000-01-01T00:00:00Z").getTime(),
    );
    expect(updated.createdAt.getTime()).toBe(row.createdAt.getTime());
  });

  it("refresh updated_at on certifications too", async () => {
    const [row] = await db
      .insert(schema.certifications)
      .values({
        name: "c",
        issuer: "i",
        updatedAt: new Date("2000-01-01T00:00:00Z"),
      })
      .returning();
    const [updated] = await db
      .update(schema.certifications)
      .set({ name: "changed" })
      .where(eq(schema.certifications.id, row.id))
      .returning();
    expect(updated.updatedAt.getTime()).toBeGreaterThan(
      new Date("2000-01-01T00:00:00Z").getTime(),
    );
  });
});

describe("seed", () => {
  it("loads the old site's data", async () => {
    await seed(db);
    const data = await getHomepageData(db);
    expect(data.profile).toMatchObject({
      name: "Chestly Ace",
      headline: "Software Engineer",
      email: "chestlyace@gmail.com",
      headlineWords: ["Backend", "Full-Stack", "Mobile"],
    });
    expect(data.skills).toHaveLength(seedData.skills.length);
    expect(data.services.map((s) => s.title)).toEqual([
      "Web Applications",
      "Websites & Landing Pages",
      "Backend & APIs",
      "Mobile Apps",
    ]);
    expect(data.projects.map((p) => p.slug)).toEqual([
      "alexdy",
      "lens-and-life",
    ]);
    expect(data.experience).toHaveLength(6);
    expect(data.volunteering).toEqual([]);
    expect(data.socials).toHaveLength(4);
    expect(data.faqs).toHaveLength(2);
    expect(data.certifications).toHaveLength(7);
  });

  it("seeds a software-only About text and valid Iconly service icons", async () => {
    await seed(db);
    const { profile, services } = await getHomepageData(db);
    expect(profile?.aboutBody).not.toMatch(
      /graphic design|photograph|creative/i,
    );
    expect(profile?.aboutBody?.split("\n\n")).toHaveLength(2);
    const iconly = await import("react-iconly");
    for (const service of services) {
      expect(Object.hasOwn(iconly, service.icon)).toBe(true);
      expect(service.items.length).toBeGreaterThan(0);
    }
  });

  it("leaves out the creative roles, tools, and FAQs (Q6, Q7)", async () => {
    await seed(db);
    const data = await getHomepageData(db);
    const organizations = data.experience.map((e) => e.organization);
    expect(organizations).not.toContain("CEY2 Youth Church");
    expect(organizations).not.toContain("Kris Kitchen");

    const skillNames = data.skills.map((s) => s.name);
    for (const creative of ["Ps", "Lr", "Canva"]) {
      expect(skillNames).not.toContain(creative);
    }
    expect(skillNames).toContain("Figma");

    expect(data.faqs.map((f) => f.question).join(" ")).not.toMatch(
      /graphic design|photography/i,
    );
  });

  it("seeds the seven badges with names and issuers, no invented dates", async () => {
    await seed(db);
    const { certifications } = await getHomepageData(db);
    expect(certifications.map((c) => c.name)).toEqual([
      "Introduction to Generative AI",
      "Introduction to Large Language Models",
      "Introduction to Responsible AI",
      "Google Cloud Essentials",
      "Introduction to Gemini for Google Workspace",
      "Gemini in Gmail",
      "Gemini in Google Docs",
    ]);
    expect(new Set(certifications.map((c) => c.issuer))).toEqual(
      new Set(["Google Cloud", "Google Workspace"]),
    );
    for (const cert of certifications) {
      expect(cert.issuedOn).toBeNull();
      expect(cert.credentialUrl).toBeNull();
      expect(cert.badgeUrl).toMatch(/^\/certs\/.+\.png$/);
    }
  });

  it("points every badge at a file that exists in public/certs", async () => {
    const files = new Set(readdirSync("public/certs"));
    for (const cert of seedData.certifications) {
      expect(files).toContain(cert.badgeUrl.replace("/certs/", ""));
    }
  });

  it("can be run twice (wipes before inserting)", async () => {
    await seed(db);
    await seed(db);
    const data = await getHomepageData(db);
    expect(data.projects).toHaveLength(2);
    expect(data.skills).toHaveLength(seedData.skills.length);
  });

  it("converts the old placeholder links to null", async () => {
    await seed(db);
    const { projects } = await getHomepageData(db);
    expect(projects.find((p) => p.slug === "lens-and-life")).toMatchObject({
      liveUrl: null,
      sourceUrl: null,
    });
  });
});

describe("getHomepageData", () => {
  it("survives a JSON round trip, which is how the cache stores it", async () => {
    await seed(db);
    const data = await getHomepageData(db);
    expect(JSON.parse(JSON.stringify(data))).toEqual(data);
  });

  it("does not expose created_at or updated_at", async () => {
    await seed(db);
    const data = await getHomepageData(db);
    const rows = [
      data.profile,
      ...data.skills,
      ...data.services,
      ...data.certifications,
      ...data.projects,
      ...data.experience,
      ...data.socials,
      ...data.faqs,
    ];
    for (const row of rows) {
      expect(row).not.toHaveProperty("createdAt");
      expect(row).not.toHaveProperty("updatedAt");
    }
  });

  it("hides unpublished certifications and orders them", async () => {
    await db.insert(schema.certifications).values([
      { name: "Second", issuer: "i", orderIndex: 2 },
      { name: "First", issuer: "i", orderIndex: 1 },
      { name: "Draft", issuer: "i", orderIndex: 3, isPublished: false },
    ]);
    const { certifications } = await getHomepageData(db);
    expect(certifications.map((c) => c.name)).toEqual(["First", "Second"]);
  });

  it("returns null profile and empty lists on an empty database", async () => {
    expect(await getHomepageData(db)).toEqual({
      profile: null,
      skills: [],
      services: [],
      certifications: [],
      projects: [],
      experience: [],
      volunteering: [],
      socials: [],
      faqs: [],
    });
  });

  it("hides unpublished rows", async () => {
    await seed(db);
    await db
      .update(schema.projects)
      .set({ isPublished: false })
      .where(eq(schema.projects.slug, "alexdy"));
    const { projects } = await getHomepageData(db);
    expect(projects.map((p) => p.slug)).toEqual(["lens-and-life"]);
  });

  it("puts featured projects first, then order_index", async () => {
    await seed(db);
    await db
      .update(schema.projects)
      .set({ isFeatured: true })
      .where(eq(schema.projects.slug, "lens-and-life"));
    const { projects } = await getHomepageData(db);
    expect(projects.map((p) => p.slug)).toEqual(["lens-and-life", "alexdy"]);
  });

  it("orders timelines by order_index", async () => {
    await seed(db);
    const { experience } = await getHomepageData(db);
    expect(experience[0].organization).toBe("NHA Health Tech.");
    expect(experience.map((e) => e.orderIndex)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("only returns socials shown on the main site", async () => {
    await seed(db);
    await db
      .update(schema.socials)
      .set({ showOn: ["creatives"] })
      .where(eq(schema.socials.platform, "TikTok"));
    const { socials } = await getHomepageData(db);
    expect(socials.map((s) => s.platform)).toEqual([
      "Instagram",
      "LinkedIn",
      "GitHub",
    ]);
  });

  it("includes published volunteering entries", async () => {
    await db.insert(schema.volunteering).values([
      { role: "Mentor", organization: "Code Club", orderIndex: 2 },
      { role: "Organizer", organization: "GDG", orderIndex: 1 },
      {
        role: "Hidden",
        organization: "Draft",
        orderIndex: 3,
        isPublished: false,
      },
    ]);
    const { volunteering } = await getHomepageData(db);
    expect(volunteering.map((v) => v.organization)).toEqual([
      "GDG",
      "Code Club",
    ]);
  });
});

describe("project pages", () => {
  const project = (slug: string, extra: object = {}) => ({
    slug,
    title: slug.toUpperCase(),
    summary: `${slug} summary`,
    ...extra,
  });

  async function addProjects() {
    await db
      .insert(schema.projects)
      .values([
        project("b", { orderIndex: 2, categoryLabel: "Mobile App" }),
        project("a", { orderIndex: 1 }),
        project("c", { orderIndex: 3, isFeatured: true, imageUrl: "/c.png" }),
        project("hidden", { orderIndex: 4, isPublished: false }),
      ]);
  }

  it("lists published slugs in homepage order", async () => {
    await addProjects();
    expect(await getProjectSlugs(db)).toEqual(["c", "a", "b"]);
  });

  it("returns the project with its case-study fields", async () => {
    await db.insert(schema.projects).values(
      project("deep", {
        problem: "P",
        approach: "A",
        outcome: "O",
        galleryUrls: ["/1.png", "/2.png"],
      }),
    );
    const page = await getProjectBySlug("deep", db);
    expect(page?.project).toMatchObject({
      slug: "deep",
      problem: "P",
      approach: "A",
      outcome: "O",
      galleryUrls: ["/1.png", "/2.png"],
    });
  });

  it("returns the next project in homepage order", async () => {
    await addProjects();
    expect((await getProjectBySlug("c", db))?.next?.slug).toBe("a");
    expect((await getProjectBySlug("a", db))?.next).toEqual({
      slug: "b",
      title: "B",
      imageUrl: null,
      categoryLabel: "Mobile App",
    });
  });

  it("wraps from the last project back to the first", async () => {
    await addProjects();
    expect((await getProjectBySlug("b", db))?.next?.slug).toBe("c");
  });

  it("has no next project when it is the only one", async () => {
    await db.insert(schema.projects).values(project("solo"));
    expect((await getProjectBySlug("solo", db))?.next).toBeNull();
  });

  it("skips unpublished projects as the next one", async () => {
    await addProjects();
    await db
      .update(schema.projects)
      .set({ isPublished: false })
      .where(eq(schema.projects.slug, "b"));
    expect((await getProjectBySlug("a", db))?.next?.slug).toBe("c");
  });

  it("returns null for unknown or unpublished slugs", async () => {
    await addProjects();
    expect(await getProjectBySlug("nope", db)).toBeNull();
    expect(await getProjectBySlug("hidden", db)).toBeNull();
  });

  it("survives a JSON round trip, like the homepage data", async () => {
    await addProjects();
    const page = await getProjectBySlug("a", db);
    expect(JSON.parse(JSON.stringify(page))).toEqual(page);
  });
});
