import { arrayContains, asc, desc, eq, getTableColumns } from "drizzle-orm";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import type {
  PgColumn,
  PgDatabase,
  PgQueryResultHKT,
  PgTable,
} from "drizzle-orm/pg-core";
import { Pool } from "pg";
import * as schema from "@/db/schema";
import { DEFAULT_LANG, type Lang } from "@/lib/i18n";
import { localize } from "@/lib/i18n/localize";
import {
  TRANSLATABLE,
  type TranslatableResource,
} from "@/lib/i18n/translatable";

// Any Drizzle Postgres database with our schema: node-postgres in the app,
// PGlite in tests.
export type Database = PgDatabase<PgQueryResultHKT, typeof schema>;

// One pool per server instance, reused across hot reloads in development.
const globalForDb = globalThis as unknown as {
  chestlyaceDb?: NodePgDatabase<typeof schema>;
};

export function getDb(): Database {
  if (!globalForDb.chestlyaceDb) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error("DATABASE_URL is not set");
    globalForDb.chestlyaceDb = drizzle(new Pool({ connectionString }), {
      schema,
    });
  }
  return globalForDb.chestlyaceDb;
}

// Public reads leave out created_at/updated_at: the results are cached as
// JSON (lib/portfolio.ts), which would turn those Dates into strings and make
// the types lie. `date` columns are plain strings already.
function publicColumns<
  T extends PgTable & { createdAt: PgColumn; updatedAt: PgColumn },
>(table: T) {
  return Object.fromEntries(
    Object.entries(getTableColumns(table)).filter(
      ([name]) => name !== "createdAt" && name !== "updatedAt",
    ),
  ) as Omit<T["_"]["columns"], "createdAt" | "updatedAt">;
}

// Rows in a language (docs/i18n.md §5): the French of each translatable field where it
// exists, the English everywhere else. English returns the rows as they are.
function localized<T extends object>(
  rows: readonly T[],
  resource: TranslatableResource,
  lang: Lang,
): T[] {
  const fields = Object.keys(TRANSLATABLE[resource]) as (keyof T)[];
  return rows.map((row) => localize(row, lang, fields));
}

// Featured projects first, then the owner's order — on the homepage grid, in
// the project page's "next project", and in the slug list.
function publishedProjects(db: Database) {
  return db
    .select(publicColumns(schema.projects))
    .from(schema.projects)
    .where(eq(schema.projects.isPublished, true))
    .orderBy(
      desc(schema.projects.isFeatured),
      asc(schema.projects.orderIndex),
      asc(schema.projects.id),
    );
}

export async function getHomepageData(
  db: Database = getDb(),
  lang: Lang = DEFAULT_LANG,
) {
  const {
    profile,
    skills,
    services,
    certifications,
    journey,
    volunteering,
    socials,
    faqs,
  } = schema;

  const [
    profileRows,
    skillRows,
    serviceRows,
    certificationRows,
    projectRows,
    experienceRows,
    volunteeringRows,
    socialRows,
    faqRows,
  ] = await Promise.all([
    db.select(publicColumns(profile)).from(profile).where(eq(profile.id, 1)),
    db
      .select(publicColumns(skills))
      .from(skills)
      .where(eq(skills.isPublished, true))
      .orderBy(asc(skills.orderIndex), asc(skills.id)),
    db
      .select(publicColumns(services))
      .from(services)
      .where(eq(services.isPublished, true))
      .orderBy(asc(services.orderIndex), asc(services.id)),
    db
      .select(publicColumns(certifications))
      .from(certifications)
      .where(eq(certifications.isPublished, true))
      .orderBy(asc(certifications.orderIndex), asc(certifications.id)),
    publishedProjects(db),
    db
      .select(publicColumns(journey))
      .from(journey)
      .where(eq(journey.isPublished, true))
      .orderBy(asc(journey.orderIndex), asc(journey.id)),
    db
      .select(publicColumns(volunteering))
      .from(volunteering)
      .where(eq(volunteering.isPublished, true))
      .orderBy(asc(volunteering.orderIndex), asc(volunteering.id)),
    db
      .select(publicColumns(socials))
      .from(socials)
      .where(arrayContains(socials.showOn, ["main"]))
      .orderBy(asc(socials.orderIndex), asc(socials.id)),
    db
      .select(publicColumns(faqs))
      .from(faqs)
      .where(eq(faqs.isPublished, true))
      .orderBy(asc(faqs.orderIndex), asc(faqs.id)),
  ]);

  return {
    // Indexing a possibly-empty result: say so, so callers must handle null.
    profile: profileRows[0]
      ? localized([profileRows[0]], "profile", lang)[0]
      : null,
    skills: skillRows,
    services: localized(serviceRows, "services", lang),
    certifications: localized(certificationRows, "certifications", lang),
    projects: localized(projectRows, "projects", lang),
    experience: localized(experienceRows, "journey", lang),
    volunteering: localized(volunteeringRows, "volunteering", lang),
    socials: socialRows,
    faqs: localized(faqRows, "faqs", lang),
  };
}

export type HomepageData = Awaited<ReturnType<typeof getHomepageData>>;

// Slugs of every published project, for generateStaticParams.
export async function getProjectSlugs(db: Database = getDb()) {
  const rows = await publishedProjects(db);
  return rows.map((row) => row.slug);
}

export type NextProject = {
  slug: string;
  title: string;
  imageUrl: string | null;
  categoryLabel: string | null;
};

// One published project and the one after it in homepage order, wrapping from
// the last back to the first (design.md §14.10). `next` is null when it is the
// only project. Unknown or unpublished slugs return null.
export async function getProjectBySlug(
  slug: string,
  db: Database = getDb(),
  lang: Lang = DEFAULT_LANG,
) {
  const projects = localized(await publishedProjects(db), "projects", lang);
  const index = projects.findIndex((project) => project.slug === slug);
  if (index === -1) return null;

  const following =
    projects.length > 1 ? projects[(index + 1) % projects.length] : null;
  const next: NextProject | null = following && {
    slug: following.slug,
    title: following.title,
    imageUrl: following.imageUrl,
    categoryLabel: following.categoryLabel,
  };
  return { project: projects[index], next };
}

export type ProjectPageData = NonNullable<
  Awaited<ReturnType<typeof getProjectBySlug>>
>;
