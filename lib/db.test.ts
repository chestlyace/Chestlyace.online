import { PGlite } from "@electric-sql/pglite";
import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { beforeEach, describe, expect, it } from "vitest";
import * as schema from "@/db/schema";
import { seed, seedData } from "@/db/seed";
import { getHomepageData, type Database } from "@/lib/db";

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
});

describe("seed", () => {
  it("loads the old site's data", async () => {
    await seed(db);
    const data = await getHomepageData(db);
    expect(data.profile?.name).toBe("Chestly Ace");
    expect(data.skills).toHaveLength(seedData.skills.length);
    expect(data.services.map((s) => s.title)).toEqual(["Software Development"]);
    expect(data.projects.map((p) => p.slug)).toEqual([
      "alexdy",
      "lens-and-life",
    ]);
    expect(data.experience).toHaveLength(8);
    expect(data.volunteering).toEqual([]);
    expect(data.socials).toHaveLength(4);
    expect(data.faqs).toHaveLength(4);
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
  it("returns null profile and empty lists on an empty database", async () => {
    expect(await getHomepageData(db)).toEqual({
      profile: null,
      skills: [],
      services: [],
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
    expect(experience.map((e) => e.orderIndex)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8,
    ]);
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
