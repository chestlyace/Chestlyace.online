import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import * as schema from "@/db/schema";
import type { Database } from "@/lib/db";
import { listPublishedEvents, type PublicEvent } from "./data";
import { albumService, eventYear, formatEventDate, nextEvent } from "./events";

let db: Database;
beforeAll(async () => {
  const instance = drizzle(new PGlite(), { schema });
  await migrate(instance, { migrationsFolder: "db/migrations" });
  db = instance;
}, 30_000);

const row = (
  slug: string,
  extra: Partial<typeof schema.photoEvents.$inferInsert> = {},
): typeof schema.photoEvents.$inferInsert => ({
  slug,
  title: slug.toUpperCase(),
  eventDate: "2026-03-14",
  coverUrl: `https://res.cloudinary.com/x/image/upload/${slug}.jpg`,
  coverWidth: 3000,
  coverHeight: 2000,
  coverAlt: `${slug} cover`,
  ...extra,
});

describe("listPublishedEvents", () => {
  beforeEach(async () => {
    await db.delete(schema.photoEvents);
  });

  it("leaves out drafts and puts the featured event first", async () => {
    await db
      .insert(schema.photoEvents)
      .values([
        row("a", { orderIndex: 1 }),
        row("draft", { isPublished: false }),
        row("b", { orderIndex: 2, isFeatured: true }),
      ]);
    const events = await listPublishedEvents(db);
    expect(events.map((e) => e.slug)).toEqual(["b", "a"]);
  });

  it("orders by the admin's order, then newest first", async () => {
    await db
      .insert(schema.photoEvents)
      .values([
        row("old", { eventDate: "2025-01-01" }),
        row("new", { eventDate: "2026-06-01" }),
      ]);
    const events = await listPublishedEvents(db);
    expect(events.map((e) => e.slug)).toEqual(["new", "old"]);
  });

  it("returns the pictures, captions and credits as plain values", async () => {
    await db.insert(schema.photoEvents).values(
      row("x", {
        images: [
          { url: "u1", width: 10, height: 20, alt: "one", caption: "First" },
          { url: "u2", width: 10, height: 20, alt: "two" },
        ],
        credits: [
          { role: "Photographer", name: "Chestly" },
          { role: "Host", name: "PyCon", url: "https://example.com" },
        ],
      }),
    );
    const [event] = await listPublishedEvents(db);
    expect(event.images.map((i) => i.caption)).toEqual(["First", null]);
    expect(event.credits).toEqual([
      { role: "Photographer", name: "Chestly", url: null },
      { role: "Host", name: "PyCon", url: "https://example.com" },
    ]);
  });
});

describe("event helpers", () => {
  it("formats a calendar date without a time zone", () => {
    expect(formatEventDate("2026-03-14")).toBe("14 Mar 2026");
    expect(formatEventDate("2026-12-01")).toBe("1 Dec 2026");
    expect(formatEventDate("nonsense")).toBe("nonsense");
    expect(eventYear({ eventDate: "2026-03-14" })).toBe("2026");
  });

  it("names the album's service only when the admin did", () => {
    expect(albumService({ albumLabel: " Google Photos " })).toBe(
      "Google Photos",
    );
    expect(albumService({ albumLabel: "  " })).toBeNull();
    expect(albumService({ albumLabel: null })).toBeNull();
  });

  it("finds the next event, wrapping round", () => {
    const events = ["a", "b", "c"].map((slug) => ({ slug })) as PublicEvent[];
    expect(nextEvent(events, "a")?.slug).toBe("b");
    expect(nextEvent(events, "c")?.slug).toBe("a");
    expect(nextEvent(events.slice(0, 1), "a")).toBeNull();
    expect(nextEvent(events, "zzz")).toBeNull();
  });
});
