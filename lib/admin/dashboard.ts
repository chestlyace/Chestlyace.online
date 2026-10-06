import { count, max, sql } from "drizzle-orm";
import * as schema from "@/db/schema";
import type { Database } from "@/lib/db";
import { RESOURCES, type ResourceId } from "./resources";

export type DashboardTile = {
  id: ResourceId;
  total: number;
  /** Null where the table has no published flag (profile, socials). */
  published: number | null;
  lastEdited: Date | null;
};

async function tally(
  db: Database,
  table: typeof schema.skills,
  hasPublished: boolean,
): Promise<Omit<DashboardTile, "id">> {
  const [row] = await db
    .select({
      total: count(),
      published: hasPublished
        ? sql<number>`count(*) filter (where ${table.isPublished})`.mapWith(
            Number,
          )
        : sql<number>`0`,
      lastEdited: max(table.updatedAt),
    })
    .from(table);
  return {
    total: row.total,
    published: hasPublished ? row.published : null,
    lastEdited: row.lastEdited,
  };
}

// One tile per resource: how many entries, how many are published, and when
// something was last changed (design.md §14.11).
export async function getDashboard(db: Database): Promise<DashboardTile[]> {
  const tables: Record<ResourceId, [unknown, boolean]> = {
    profile: [schema.profile, false],
    skills: [schema.skills, true],
    services: [schema.services, true],
    projects: [schema.projects, true],
    experience: [schema.journey, true],
    volunteering: [schema.volunteering, true],
    certifications: [schema.certifications, true],
    socials: [schema.socials, false],
    faq: [schema.faqs, true],
  };
  return Promise.all(
    RESOURCES.map(async ({ id }) => {
      const [table, hasPublished] = tables[id];
      return {
        id,
        ...(await tally(db, table as typeof schema.skills, hasPublished)),
      };
    }),
  );
}
