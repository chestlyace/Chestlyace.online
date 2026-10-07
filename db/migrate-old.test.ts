import { PGlite } from "@electric-sql/pglite";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { beforeAll, describe, expect, it } from "vitest";
import * as schema from "@/db/schema";
import {
  TargetNotEmpty,
  load,
  parseDates,
  readOld,
  report,
  transform,
  type OldData,
  type Options,
} from "@/db/migrate-old";
import { seedData } from "@/db/seed";
import type { Database } from "@/lib/db";

// The old site's own setup file stands in for a live dump.
async function oldDatabase() {
  const old = new PGlite();
  await old.exec(readFileSync("db/fixtures/old-site.sql", "utf8"));
  return old;
}

async function newDatabase(): Promise<Database> {
  const db = drizzle(new PGlite(), { schema });
  await migrate(db, { migrationsFolder: "db/migrations" });
  return db;
}

const devicons = readdirSync("public/devicon");
const options: Options = {
  logoExists: (name) => existsSync(`public/logos/${name}`),
  iconExists: (slug) => devicons.some((file) => file.startsWith(`${slug}-`)),
};

let old: OldData;
beforeAll(async () => {
  old = await readOld(await oldDatabase());
});

describe("parseDates", () => {
  it.each([
    ["Dec 2025 - Present", "2025-12-01", null, true],
    ["2025 - Present", "2025-01-01", null, true],
    ["Sep 2024 - Oct 2024", "2024-09-01", "2024-10-01", true],
    ["2023 - 2025", "2023-01-01", "2025-01-01", true],
    ["Sept 2023 – Jan 2024", "2023-09-01", "2024-01-01", true],
    ["2024", "2024-01-01", "2024-01-01", true],
  ])("%s", (label, startDate, endDate, ok) => {
    expect(parseDates(label)).toEqual({ startDate, endDate, ok });
  });

  it.each(["", "sometime", "Soon - Later", "Present - 2020"])(
    "cannot read %j",
    (label) => {
      expect(parseDates(label || null).ok).toBe(false);
    },
  );
});

describe("transform of the old site's data", () => {
  const migrated = () => transform(old, options);

  it("keeps the profile's contact details and the decided email", () => {
    const { profile, warnings } = migrated();
    expect(profile).toMatchObject({
      name: "Chestly Ace",
      displayName: "DEV.ACE",
      phone: "+237 676 940 247",
      whatsappNumber: "237676940247",
      email: "chestlyace@gmail.com",
      headline: "Software Engineer",
      heroImageUrl: "/hero.webp",
      resumeUrl: "resume.pdf",
    });
    expect(warnings.some((w) => w.includes("developerace0@gmail.com"))).toBe(
      true,
    );
    expect(warnings.some((w) => w.includes("Résumé"))).toBe(true);
    expect(warnings.some((w) => w.includes("684d5ff7"))).toBe(true);
  });

  it("converts skill icons and categories, and leaves out the creative tools", () => {
    const { skills, creatives } = migrated();
    const byName = Object.fromEntries(skills.map((s) => [s.name, s]));
    expect(skills).toHaveLength(old.skills.length - 3);
    expect(creatives.skills.map((s) => s.name)).toEqual(["Ps", "Canva", "Lr"]);
    expect(byName.HTML).toMatchObject({
      category: "language",
      iconSlug: "html5",
    });
    expect(byName["Next.js"]).toMatchObject({ iconSlug: "nextjs" });
    expect(byName.JS).toMatchObject({ iconSlug: "javascript" });
    expect(byName.Figma).toMatchObject({ category: "tool", iconSlug: "figma" });
    expect(byName.MongoDB.category).toBe("database");
    expect(byName.PostgreSQL.category).toBe("database");
    expect(byName["Google Cloud"].category).toBe("cloud");
    expect(byName.AWS).toMatchObject({ category: "cloud", iconSlug: null });
    expect(byName.AWS.iconUrl).toMatch(/^https:\/\//);
  });

  it("makes projects with slugs and summaries, and empties '#' links", () => {
    const { projects, creatives } = migrated();
    expect(projects.map((p) => p.slug)).toEqual(["alexdy", "lens-and-life"]);
    expect(projects[0]).toMatchObject({
      title: "Alexdy",
      liveUrl: "https://alexdy.com",
      sourceUrl: null,
      techStack: ["Laravel", "PHP", "Tailwind", "MySQL"],
      categoryLabel: "Full Stack",
    });
    expect(projects[0].summary).toBe(
      "Alexdy is a premium digital marketplace designed to bridge the gap between quality service providers and consumers.",
    );
    expect(projects[1]).toMatchObject({ liveUrl: null, sourceUrl: null });
    expect(creatives.works).toHaveLength(8);
  });

  it("numbers the slugs of projects that share a title", () => {
    const twin = old.works.find((w) => w.type === "project")!;
    const { projects } = transform({ ...old, works: [twin, twin] }, options);
    expect(projects.map((p) => p.slug)).toEqual(["alexdy", "alexdy-2"]);
  });

  it("turns the timeline into dated entries with logos, minus the creative roles", () => {
    const { journey, creatives, warnings } = migrated();
    expect(journey).toHaveLength(6);
    expect(creatives.journey.map((j) => j.company)).toEqual([
      "CEY2 Youth Church",
      "Kris Kitchen",
    ]);
    expect(journey[0]).toMatchObject({
      type: "work",
      role: "Backend Developer(Intern)",
      organization: "NHA Health Tech.",
      startDate: "2025-12-01",
      endDate: null,
      datesLabel: "Dec 2025 - Present",
      logoUrl: "logos/ets_nhahealthtech_logo.jpeg",
    });
    expect(journey[2]).toMatchObject({
      type: "education",
      logoUrl: "logos/yibs.png",
    });
    expect(journey[4].logoUrl).toBeNull();
    expect(warnings.filter((w) => w.startsWith("Experience"))).toEqual([]);
  });

  it("warns about a logo file that is not in public/logos", () => {
    const { journey, warnings } = transform(old, {
      ...options,
      logoExists: () => false,
    });
    expect(journey.every((j) => j.logoUrl === null)).toBe(true);
    expect(
      warnings.filter((w) => w.includes("not in public/logos")).length,
    ).toBe(4);
  });

  it("normalises the social icons", () => {
    const { socials } = migrated();
    expect(socials.map((s) => [s.platform, s.icon])).toEqual([
      ["Instagram", "instagram"],
      ["LinkedIn", "linkedin"],
      ["GitHub", "github"],
      ["TikTok", "tiktok"],
    ]);
  });

  it("exports the creative services, and loads none of the old services", () => {
    const { creatives } = migrated();
    expect(creatives.services.map((s) => s.title)).toEqual([
      "UI/UX & Graphic Design",
      "Photography",
      "Event Coverage",
    ]);
  });

  it("reports counts and what to check", () => {
    const lines = report(old, migrated()).join("\n");
    expect(lines).toContain("skills       29 → 26");
    expect(lines).toContain(
      "works        10 → 2 projects (8 design/event works exported)",
    );
    expect(lines).toContain("to check:");
  });

  it("copes with an empty old database", () => {
    const empty: OldData = {
      profile: null,
      skills: [],
      services: [],
      works: [],
      journey: [],
      socials: [],
    };
    const { profile, skills, warnings } = transform(empty, options);
    expect(profile.name).toBe(seedData.profile.name);
    expect(skills).toEqual([]);
    expect(warnings[0]).toContain("no profile row");
  });

  it("clips an over-long first sentence and refuses non-web links", () => {
    const long = `${"word ".repeat(80)}ends.`;
    const { projects, warnings } = transform(
      {
        ...old,
        works: [
          {
            type: "project",
            title: "Long",
            description: long,
            image_url: "pic.png",
            live_url: "javascript:alert(1)",
            tech_stack: '["A"]',
          },
        ],
      },
      options,
    );
    expect(projects[0].summary.length).toBeLessThanOrEqual(300);
    expect(projects[0]).toMatchObject({
      liveUrl: null,
      imageUrl: null,
      techStack: ["A"],
    });
    expect(warnings.filter((w) => w.startsWith('Project "Long"'))).toHaveLength(
      3,
    );
  });
});

describe("load", () => {
  it("fills an empty database: migrated tables plus the seed's other content", async () => {
    const db = await newDatabase();
    await load(db, transform(old, options));

    expect((await db.select().from(schema.skills)).length).toBe(26);
    expect(
      (await db.select().from(schema.projects)).map((p) => p.slug),
    ).toEqual(["alexdy", "lens-and-life"]);
    expect(
      (await db.select().from(schema.journey)).map((j) => j.orderIndex),
    ).toEqual([1, 2, 3, 4, 5, 6]);
    expect((await db.select().from(schema.services)).length).toBe(
      seedData.services.length,
    );
    expect((await db.select().from(schema.faqs)).length).toBe(
      seedData.faqs.length,
    );
    expect((await db.select().from(schema.certifications)).length).toBe(7);
    const [profile] = await db
      .select()
      .from(schema.profile)
      .where(eq(schema.profile.id, 1));
    expect(profile.headlineWords).toEqual(["Backend", "Full-Stack", "Mobile"]);
  });

  it("refuses a database that already has content, and changes nothing", async () => {
    const db = await newDatabase();
    const migrated = transform(old, options);
    await load(db, migrated);
    await expect(load(db, migrated)).rejects.toBeInstanceOf(TargetNotEmpty);
    expect((await db.select().from(schema.projects)).length).toBe(2);
  });

  it("replaces the content when asked", async () => {
    const db = await newDatabase();
    const migrated = transform(old, options);
    await load(db, migrated);
    await load(
      db,
      { ...migrated, projects: migrated.projects.slice(0, 1) },
      true,
    );
    expect((await db.select().from(schema.projects)).length).toBe(1);
  });
});
