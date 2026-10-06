import { arrayContains, asc, desc, eq } from "drizzle-orm";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { Pool } from "pg";
import * as schema from "@/db/schema";

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

export async function getHomepageData(db: Database = getDb()) {
  const {
    profile,
    skills,
    services,
    projects,
    journey,
    volunteering,
    socials,
    faqs,
  } = schema;

  const [
    profileRows,
    skillRows,
    serviceRows,
    projectRows,
    experienceRows,
    volunteeringRows,
    socialRows,
    faqRows,
  ] = await Promise.all([
    db.select().from(profile).where(eq(profile.id, 1)),
    db
      .select()
      .from(skills)
      .where(eq(skills.isPublished, true))
      .orderBy(asc(skills.orderIndex), asc(skills.id)),
    db
      .select()
      .from(services)
      .where(eq(services.isPublished, true))
      .orderBy(asc(services.orderIndex), asc(services.id)),
    db
      .select()
      .from(projects)
      .where(eq(projects.isPublished, true))
      .orderBy(
        desc(projects.isFeatured),
        asc(projects.orderIndex),
        asc(projects.id),
      ),
    db
      .select()
      .from(journey)
      .where(eq(journey.isPublished, true))
      .orderBy(asc(journey.orderIndex), asc(journey.id)),
    db
      .select()
      .from(volunteering)
      .where(eq(volunteering.isPublished, true))
      .orderBy(asc(volunteering.orderIndex), asc(volunteering.id)),
    db
      .select()
      .from(socials)
      .where(arrayContains(socials.showOn, ["main"]))
      .orderBy(asc(socials.orderIndex), asc(socials.id)),
    db
      .select()
      .from(faqs)
      .where(eq(faqs.isPublished, true))
      .orderBy(asc(faqs.orderIndex), asc(faqs.id)),
  ]);

  return {
    profile: profileRows[0] ?? null,
    skills: skillRows,
    services: serviceRows,
    projects: projectRows,
    experience: experienceRows,
    volunteering: volunteeringRows,
    socials: socialRows,
    faqs: faqRows,
  };
}

export type HomepageData = Awaited<ReturnType<typeof getHomepageData>>;
