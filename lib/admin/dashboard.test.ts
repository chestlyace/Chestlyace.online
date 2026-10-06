import { PGlite } from "@electric-sql/pglite";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { beforeEach, describe, expect, it } from "vitest";
import * as schema from "@/db/schema";
import { seed } from "@/db/seed";
import type { Database } from "@/lib/db";
import { getDashboard } from "./dashboard";
import { RESOURCES } from "./resources";

let db: Database;
beforeEach(async () => {
  const fresh = drizzle(new PGlite(), { schema });
  await migrate(fresh, { migrationsFolder: "db/migrations" });
  db = fresh;
});

describe("getDashboard", () => {
  it("has a tile for every resource, in nav order, and zeros for an empty database", async () => {
    const tiles = await getDashboard(db);
    expect(tiles.map((t) => t.id)).toEqual(RESOURCES.map((r) => r.id));
    for (const tile of tiles) {
      expect(tile.total).toBe(0);
      expect(tile.lastEdited).toBeNull();
    }
  });

  it("counts entries, drafts and the latest edit after seeding", async () => {
    await seed(db);
    const before = await getDashboard(db);
    const byId = Object.fromEntries(before.map((t) => [t.id, t]));
    expect(byId.projects).toMatchObject({ total: 2, published: 2 });
    expect(byId.experience.total).toBe(6);
    expect(byId.volunteering).toMatchObject({ total: 0, published: 0 });
    expect(byId.certifications.total).toBe(7);
    expect(byId.profile).toMatchObject({ total: 1, published: null });
    expect(byId.socials).toMatchObject({ total: 4, published: null });
    expect(byId.projects.lastEdited).toBeInstanceOf(Date);

    await db
      .update(schema.projects)
      .set({ isPublished: false })
      .where(eq(schema.projects.slug, "alexdy"));
    const after = await getDashboard(db);
    expect(after.find((t) => t.id === "projects")).toMatchObject({
      total: 2,
      published: 1,
    });
  });
});
