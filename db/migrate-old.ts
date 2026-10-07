// One-off migration from the old site's live database (a scratch Postgres loaded
// from the owner's pg_dump) into the new schema — content-schema.md §6.
//
//   OLD_DATABASE_URL=… pnpm migrate:old                 # dry run: report only
//   OLD_DATABASE_URL=… DATABASE_URL=… pnpm migrate:old --write
//
// The old tables supply what they hold: contact details, skills, projects, the
// experience timeline and the socials. Everything the old database never had
// (services, FAQ, certifications, the hero's rotating words, the About text,
// the contact email) keeps the content of the dev seed, which the owner has
// already reviewed. Design, photography and event material is not loaded: it is
// written to a JSON file for the creatives site (Phase 10).
import { existsSync, readdirSync, writeFileSync } from "node:fs";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { slugify } from "../lib/admin/order.ts";
import * as schema from "./schema.ts";
import { seedData } from "./seed.ts";

type Database = PgDatabase<PgQueryResultHKT, typeof schema>;
type Row = Record<string, unknown>;

/** What the old database is read through: a pg Pool or a PGlite both fit. */
export type OldDb = { query(sql: string): Promise<{ rows: Row[] }> };

export type OldData = {
  profile: Row | null;
  skills: Row[];
  services: Row[];
  works: Row[];
  journey: Row[];
  socials: Row[];
};

export async function readOld(old: OldDb): Promise<OldData> {
  const all = async (table: string, order: string) =>
    (await old.query(`select * from ${table} order by ${order}`)).rows;
  const profile = await all("profile", "id");
  return {
    profile: profile[0] ?? null,
    skills: await all("skills", "id"),
    services: await all("services", "id"),
    works: await all("works", "id"),
    journey: await all("journey", "order_index, id"),
    socials: await all("socials", "id"),
  };
}

const text = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
};

const isHttp = (value: string) => /^https?:\/\/\S+$/i.test(value);

function list(value: unknown): string[] {
  let items = value;
  if (typeof items === "string") {
    try {
      items = JSON.parse(items);
    } catch {
      return [];
    }
  }
  return Array.isArray(items)
    ? items.filter((x): x is string => typeof x === "string" && x.trim() !== "")
    : [];
}

// ---- dates ("Dec 2025 - Present", "2023 - 2025") -------------------------------

const MONTHS: Record<string, string> = {
  jan: "01",
  feb: "02",
  mar: "03",
  apr: "04",
  may: "05",
  jun: "06",
  jul: "07",
  aug: "08",
  sep: "09",
  sept: "09",
  oct: "10",
  nov: "11",
  dec: "12",
};

type DatePart = { date: string | null; ongoing: boolean; ok: boolean };

function parseDatePart(part: string): DatePart {
  const value = part.trim().toLowerCase();
  if (/^(present|now|current|ongoing|today)$/.test(value))
    return { date: null, ongoing: true, ok: true };
  const monthYear = value.match(/^([a-z]+)\.?\s+(\d{4})$/);
  const month =
    monthYear &&
    MONTHS[
      monthYear[1].slice(0, 4) === "sept" ? "sept" : monthYear[1].slice(0, 3)
    ];
  if (monthYear && month)
    return { date: `${monthYear[2]}-${month}-01`, ongoing: false, ok: true };
  if (/^\d{4}$/.test(value))
    return { date: `${value}-01-01`, ongoing: false, ok: true };
  return { date: null, ongoing: false, ok: false };
}

/** A year alone becomes January 1st; "Present" leaves the end empty. */
export function parseDates(label: string | null): {
  startDate: string | null;
  endDate: string | null;
  ok: boolean;
} {
  if (!label) return { startDate: null, endDate: null, ok: false };
  const range = label.split(/\s*[-–—]\s*/);
  if (range.length === 1) {
    const only = parseDatePart(range[0]);
    return {
      startDate: only.date,
      endDate: only.date,
      ok: only.ok && !only.ongoing,
    };
  }
  if (range.length !== 2) return { startDate: null, endDate: null, ok: false };
  const start = parseDatePart(range[0]);
  const end = parseDatePart(range[1]);
  return {
    startDate: start.date,
    endDate: end.date,
    ok: start.ok && !start.ongoing && end.ok,
  };
}

// ---- transform ------------------------------------------------------------------

// The old site's design and photography skills and roles move to the creatives
// site (Q6, Q7).
const CREATIVE_TOOLS = new Set(["ps", "lr", "canva", "photoshop", "lightroom"]);
const CREATIVE_ORGANIZATIONS = new Set(["cey2 youth church", "kris kitchen"]);
const DATABASES = new Set([
  "mongodb",
  "mysql",
  "postgresql",
  "postgres",
  "sqlite",
  "redis",
]);
const CLOUDS = new Set(["google cloud", "aws", "azure"]);
const CATEGORIES = new Set([
  "language",
  "framework",
  "tool",
  "cloud",
  "database",
]);
const SOCIAL_ICONS = new Set([
  "instagram",
  "linkedin",
  "github",
  "tiktok",
  "whatsapp",
]);

export type Options = {
  /** Is this file in public/logos/? */
  logoExists?: (name: string) => boolean;
  /** Is there a Devicon icon with this slug? */
  iconExists?: (slug: string) => boolean;
};

export type Migrated = {
  profile: typeof schema.profile.$inferInsert;
  skills: (typeof schema.skills.$inferInsert)[];
  projects: (typeof schema.projects.$inferInsert)[];
  journey: (typeof schema.journey.$inferInsert)[];
  socials: (typeof schema.socials.$inferInsert)[];
  creatives: { works: Row[]; journey: Row[]; services: Row[]; skills: Row[] };
  warnings: string[];
};

export function transform(old: OldData, options: Options = {}): Migrated {
  const warnings: string[] = [];
  const warn = (message: string) => warnings.push(message);
  const creatives: Migrated["creatives"] = {
    works: [],
    journey: [],
    services: [],
    skills: [],
  };

  // -- profile
  const seed = seedData.profile;
  const row = old.profile;
  let profile: Migrated["profile"] = {
    ...seed,
    headlineWords: [...seed.headlineWords],
  };
  if (!row) {
    warn("The old database has no profile row: the profile is the dev seed's.");
  } else {
    const hero = text(row.hero_image);
    let heroImageUrl: string = seed.heroImageUrl;
    if (hero && isHttp(hero)) heroImageUrl = hero;
    else if (hero)
      warn(
        `Hero image "${hero}" is a file name from the old site; the profile uses /hero.webp. Upload the right one in the admin if that is not it.`,
      );
    const resume = text(row.resume_url);
    if (resume && !isHttp(resume))
      warn(
        `Résumé "${resume}" is a file name from the old site. Upload the PDF in the admin (Profile → Résumé) before launch; /resume.pdf is a 404 until then.`,
      );
    const email = text(row.email);
    if (email && email.toLowerCase() !== seed.email)
      warn(`The old email is ${email}; the profile keeps ${seed.email} (Q9).`);
    profile = {
      ...profile,
      name: text(row.name) ?? seed.name,
      displayName: text(row.display_name) ?? seed.displayName,
      tagline: text(row.tagline) ?? seed.tagline,
      aboutQuote: text(row.about_quote) ?? seed.aboutQuote,
      phone: text(row.phone) ?? seed.phone,
      whatsappNumber: text(row.whatsapp_number) ?? seed.whatsappNumber,
      resumeUrl: resume ?? seed.resumeUrl,
      heroImageUrl,
    };
  }

  // -- skills
  const bySeedName = new Map<
    string,
    { iconSlug: string | null; iconUrl: string | null }
  >(
    seedData.skills.map((s) => [
      s.name.toLowerCase(),
      { iconSlug: s.iconSlug, iconUrl: s.iconUrl },
    ]),
  );
  const skills: Migrated["skills"] = [];
  for (const skill of old.skills) {
    const name = text(skill.name);
    if (!name) continue;
    const key = name.toLowerCase();
    if (CREATIVE_TOOLS.has(key)) {
      creatives.skills.push(skill);
      continue;
    }
    let category = (text(skill.category) ?? "tool").toLowerCase();
    if (CLOUDS.has(key)) category = "cloud";
    else if (DATABASES.has(key)) category = "database";
    else if (!CATEGORIES.has(category)) {
      warn(
        `Skill "${name}" has the category "${category}"; it becomes "tool".`,
      );
      category = "tool";
    }

    const icon = text(skill.icon) ?? "";
    const devicon = icon.match(/\/icons\/([a-z0-9-]+)\//i)?.[1].toLowerCase();
    let iconSlug: string | null = null;
    let iconUrl: string | null = null;
    if (devicon && (options.iconExists?.(devicon) ?? true)) {
      iconSlug = devicon;
    } else if (bySeedName.has(key)) {
      ({ iconSlug, iconUrl } = bySeedName.get(key)!);
    } else if (isHttp(icon)) {
      iconUrl = icon;
    } else {
      warn(
        `Skill "${name}" has no icon the new site can use ("${icon}"); pick one in the admin.`,
      );
    }
    skills.push({ name, category, iconSlug, iconUrl });
  }

  // -- projects (design and event works go to the creatives export)
  const projects: Migrated["projects"] = [];
  const slugs = new Set<string>();
  for (const work of old.works) {
    if (work.type !== "project") {
      creatives.works.push(work);
      continue;
    }
    const title = text(work.title);
    if (!title) continue;
    let slug = slugify(title) || "project";
    for (let n = 2; slugs.has(slug); n++)
      slug = `${slugify(title) || "project"}-${n}`;
    slugs.add(slug);

    const description = text(work.description);
    let summary =
      description?.match(/^([\s\S]+?[.!?])(\s|$)/)?.[1] ?? description ?? title;
    if (summary.length > 300) {
      summary = `${summary.slice(0, 297).trimEnd()}…`;
      warn(
        `Project "${title}": the first sentence is over 300 characters; the summary is cut. Edit it in the admin.`,
      );
    }
    const link = (value: unknown, label: string) => {
      const url = text(value);
      if (!url || url === "#") return null;
      if (!isHttp(url)) {
        warn(
          `Project "${title}": the ${label} link "${url}" is not a web address; it is left empty.`,
        );
        return null;
      }
      return url;
    };
    const image = text(work.image_url);
    if (image && !isHttp(image))
      warn(
        `Project "${title}": the image "${image}" is a file name from the old site; it is left empty. Upload it in the admin.`,
      );

    projects.push({
      slug,
      title,
      summary,
      description,
      imageUrl: image && isHttp(image) ? image : null,
      techStack: list(work.tech_stack),
      categoryLabel: text(work.category_label),
      liveUrl: link(work.live_url, "live"),
      sourceUrl: link(work.source_url, "source"),
      isLiveUrlPrivate: work.is_live_url_private === true,
      isSourceUrlPrivate: work.is_source_url_private === true,
    });
  }

  // -- journey
  const journey: Migrated["journey"] = [];
  for (const entry of old.journey) {
    const organization = text(entry.company);
    const role = text(entry.role);
    if (!role || !organization) continue;
    if (CREATIVE_ORGANIZATIONS.has(organization.toLowerCase())) {
      creatives.journey.push(entry);
      continue;
    }
    const label = text(entry.dates);
    const dates = parseDates(label);
    if (!dates.ok)
      warn(
        `Experience "${role} — ${organization}": the dates "${label ?? ""}" could not be read; they are kept as text only.`,
      );

    const logo = text(entry.logo_url);
    let logoUrl: string | null = null;
    if (logo && isHttp(logo)) logoUrl = logo;
    else if (logo) {
      if (options.logoExists?.(logo) ?? true) logoUrl = `logos/${logo}`;
      else
        warn(
          `Experience "${role} — ${organization}": the logo file "${logo}" is not in public/logos/; the entry has no logo.`,
        );
    }
    let type = text(entry.type);
    if (type !== "work" && type !== "education") {
      warn(
        `Experience "${role} — ${organization}": the type "${type ?? ""}" becomes "work".`,
      );
      type = "work";
    }
    journey.push({
      type,
      role,
      organization,
      startDate: dates.startDate,
      endDate: dates.endDate,
      datesLabel: label,
      description: text(entry.description),
      logoUrl,
    });
  }

  // -- socials
  const socials: Migrated["socials"] = [];
  for (const social of old.socials) {
    const platform = text(social.platform);
    const url = text(social.url);
    if (!platform || !url) continue;
    if (!isHttp(url)) {
      warn(
        `Social "${platform}": "${url}" is not a web address; it is left out.`,
      );
      continue;
    }
    const classes = text(social.icon) ?? "";
    const derived = classes
      .match(/fa-([a-z0-9-]+)/i)?.[1]
      ?.toLowerCase()
      .replace(/-(in|alt|square)$/, "");
    const icon = [derived, platform.toLowerCase()].find(
      (name): name is string => !!name && SOCIAL_ICONS.has(name),
    );
    if (!icon)
      warn(
        `Social "${platform}" has no logo on the new site; it shows a plain link icon.`,
      );
    socials.push({
      platform,
      url,
      icon: icon ?? derived ?? platform.toLowerCase(),
    });
  }

  for (const service of old.services) {
    if (text(service.title)?.toLowerCase() !== "software development")
      creatives.services.push(service);
  }

  return { profile, skills, projects, journey, socials, creatives, warnings };
}

// ---- report ---------------------------------------------------------------------

export function report(old: OldData, migrated: Migrated): string[] {
  const lines = [
    "From the old database:",
    `  profile      ${old.profile ? "1 row" : "none"}`,
    `  skills       ${old.skills.length} → ${migrated.skills.length} (${migrated.creatives.skills.length} creative tools left out)`,
    `  works        ${old.works.length} → ${migrated.projects.length} projects (${migrated.creatives.works.length} design/event works exported)`,
    `  journey      ${old.journey.length} → ${migrated.journey.length} (${migrated.creatives.journey.length} creative roles exported)`,
    `  socials      ${old.socials.length} → ${migrated.socials.length}`,
    `  services     ${old.services.length} old rows not loaded (${migrated.creatives.services.length} exported for the creatives site)`,
    "Kept from the dev seed (no old source):",
    `  services ${seedData.services.length}, FAQ ${seedData.faqs.length}, certifications ${seedData.certifications.length}, hero words, About text, email`,
  ];
  if (migrated.warnings.length > 0) {
    lines.push(`${migrated.warnings.length} to check:`);
    for (const warning of migrated.warnings) lines.push(`  - ${warning}`);
  } else {
    lines.push("Nothing to check.");
  }
  return lines;
}

// ---- load -----------------------------------------------------------------------

const withOrder = <T extends object>(rows: readonly T[]) =>
  rows.map((row, index) => ({ ...row, orderIndex: index + 1 }));

const TABLES = [
  schema.faqs,
  schema.socials,
  schema.certifications,
  schema.volunteering,
  schema.journey,
  schema.projects,
  schema.services,
  schema.skills,
  schema.profile,
] as const;

export class TargetNotEmpty extends Error {}

export async function load(db: Database, migrated: Migrated, replace = false) {
  await db.transaction(async (tx) => {
    if (!replace) {
      for (const table of [
        schema.profile,
        schema.skills,
        schema.projects,
        schema.journey,
        schema.socials,
      ]) {
        const rows = await tx.select().from(table).limit(1);
        if (rows.length > 0)
          throw new TargetNotEmpty(
            "The target database already has content. Nothing was written. Use --replace to wipe it first.",
          );
      }
    } else {
      for (const table of TABLES) await tx.delete(table);
    }

    await tx.insert(schema.profile).values(migrated.profile);
    await tx.insert(schema.skills).values(withOrder(migrated.skills));
    await tx
      .insert(schema.services)
      .values(
        withOrder(
          seedData.services.map((s) => ({ ...s, items: [...s.items] })),
        ),
      );
    await tx.insert(schema.projects).values(withOrder(migrated.projects));
    await tx.insert(schema.journey).values(withOrder(migrated.journey));
    await tx
      .insert(schema.certifications)
      .values(withOrder(seedData.certifications));
    await tx.insert(schema.socials).values(withOrder(migrated.socials));
    await tx.insert(schema.faqs).values(withOrder(seedData.faqs));
  });
}

// ---- command line ---------------------------------------------------------------

if (import.meta.main) {
  const args = process.argv.slice(2);
  const write = args.includes("--write");
  const replace = args.includes("--replace");
  const out = args.includes("--creatives-out")
    ? args[args.indexOf("--creatives-out") + 1]
    : "old-creatives.json";

  const oldUrl = process.env.OLD_DATABASE_URL;
  if (!oldUrl) {
    console.error(
      "Set OLD_DATABASE_URL to the scratch database holding the old dump.",
    );
    process.exit(1);
  }
  const targetUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (write && !targetUrl) {
    console.error("Set DATABASE_URL (or DIRECT_URL) to the new database.");
    process.exit(1);
  }

  const { Pool } = await import("pg");
  const oldPool = new Pool({ connectionString: oldUrl });
  const newPool = write ? new Pool({ connectionString: targetUrl }) : null;
  try {
    const old = await readOld(oldPool);
    const devicons = existsSync("public/devicon")
      ? readdirSync("public/devicon")
      : null;
    const migrated = transform(old, {
      logoExists: (name) => existsSync(`public/logos/${name}`),
      iconExists: devicons
        ? (slug) => devicons.some((file) => file.startsWith(`${slug}-`))
        : undefined,
    });
    for (const line of report(old, migrated)) console.log(line);

    writeFileSync(out, `${JSON.stringify(migrated.creatives, null, 2)}\n`);
    console.log(`Creatives material written to ${out} (keep it for Phase 10).`);

    if (!newPool) {
      console.log(
        "\nDry run: nothing was written. Add --write to load the new database.",
      );
    } else {
      const target = new URL(targetUrl as string);
      console.log(
        `\nWriting to ${target.hostname}${target.pathname}${replace ? " (replacing what is there)" : ""}…`,
      );
      const { drizzle } = await import("drizzle-orm/node-postgres");
      try {
        await load(drizzle(newPool, { schema }), migrated, replace);
        console.log("\nLoaded the new database.");
      } catch (error) {
        if (error instanceof TargetNotEmpty) {
          console.error(`\n${error.message}`);
          process.exitCode = 1;
        } else throw error;
      }
    }
  } finally {
    await oldPool.end();
    await newPool?.end();
  }
}
