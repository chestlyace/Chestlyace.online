import { asc, eq, inArray, max } from "drizzle-orm";
import type { PgColumn, PgTable } from "drizzle-orm/pg-core";
import type { z } from "zod";
import * as schema from "@/db/schema";
import type { Database } from "@/lib/db";
import type { Translations } from "@/lib/i18n/localize";
import {
  withCreativesDefaults,
  type CreativesSettings,
} from "@/lib/creativesCopy";
import { withDefaults, type NewsletterSettings } from "@/lib/newsletterCopy";
import {
  certificationSchema,
  creativeFaqSchema,
  creativeServiceSchema,
  creativesSettingsSchema,
  designPieceSchema,
  photoEventSchema,
  faqSchema,
  fieldErrors,
  journeySchema,
  newsletterSchema,
  profileSchema,
  projectSchema,
  reorderSchema,
  serviceSchema,
  skillSchema,
  socialSchema,
  volunteeringSchema,
} from "./schemas";

// The admin API's logic (content-schema.md §2), apart from HTTP: the route
// handlers check the session and the request, call these, and revalidate the
// public site. Taking the database as a parameter keeps them testable with PGlite.

type AdminTable = PgTable & {
  id: PgColumn;
  orderIndex: PgColumn;
};

type ResourceConfig = {
  table: AdminTable;
  schema: z.ZodObject;
  /** Has an `is_published` column: new entries start unpublished. */
  published: boolean;
  /**
   * What a new entry gets for the fields it may leave out. Not in the schema:
   * an update that omits a list must leave it alone, not empty it.
   */
  defaults?: Record<string, unknown>;
};

const RESOURCES: Record<string, ResourceConfig> = {
  skills: {
    table: schema.skills as unknown as AdminTable,
    schema: skillSchema,
    published: true,
  },
  services: {
    table: schema.services as unknown as AdminTable,
    schema: serviceSchema,
    published: true,
    defaults: { items: [] },
  },
  certifications: {
    table: schema.certifications as unknown as AdminTable,
    schema: certificationSchema,
    published: true,
  },
  socials: {
    table: schema.socials as unknown as AdminTable,
    schema: socialSchema,
    published: false,
  },
  projects: {
    table: schema.projects as unknown as AdminTable,
    schema: projectSchema,
    published: true,
    defaults: { techStack: [], galleryUrls: [] },
  },
  journey: {
    table: schema.journey as unknown as AdminTable,
    schema: journeySchema,
    published: true,
  },
  volunteering: {
    table: schema.volunteering as unknown as AdminTable,
    schema: volunteeringSchema,
    published: true,
  },
  faqs: {
    table: schema.faqs as unknown as AdminTable,
    schema: faqSchema,
    published: true,
  },
  // The creatives site (D86, design.md §14.26).
  "design-pieces": {
    table: schema.designPieces as unknown as AdminTable,
    schema: designPieceSchema,
    published: true,
    defaults: { images: [], tools: [], isFeatured: false },
  },
  "photo-events": {
    table: schema.photoEvents as unknown as AdminTable,
    schema: photoEventSchema,
    published: true,
    defaults: { covered: [], images: [], credits: [], isFeatured: false },
  },
  "creative-services": {
    table: schema.creativeServices as unknown as AdminTable,
    schema: creativeServiceSchema,
    published: true,
    defaults: { items: [] },
  },
  "creative-faqs": {
    table: schema.creativeFaqs as unknown as AdminTable,
    schema: creativeFaqSchema,
    published: true,
  },
};

/** The resources of the creatives site: their writes revalidate its pages. */
export const isCreativesResource = (name: string) =>
  [
    "design-pieces",
    "photo-events",
    "creative-services",
    "creative-faqs",
  ].includes(name);

export const isAdminApiResource = (name: string) =>
  Object.hasOwn(RESOURCES, name);

export type Row = Record<string, unknown> & { id: number };

export type Failure =
  | { ok: false; status: 404; error: "not-found" }
  | {
      ok: false;
      status: 422;
      error: "invalid";
      fields: Record<string, string>;
    };

const notFound: Failure = { ok: false, status: 404, error: "not-found" };

// A project's address (slug) is unique: a clash comes back as a message on that
// field, not a server error.
function uniqueViolation(error: unknown): Failure | null {
  const code = (e: unknown) =>
    typeof e === "object" && e !== null && "code" in e
      ? String((e as { code: unknown }).code)
      : "";
  const cause = (error as { cause?: unknown } | null)?.cause;
  if (code(error) !== "23505" && code(cause) !== "23505") return null;
  return {
    ok: false,
    status: 422,
    error: "invalid",
    fields: { slug: "Another entry already uses that address." },
  };
}

function resource(name: string): ResourceConfig {
  const config = Object.hasOwn(RESOURCES, name) ? RESOURCES[name] : undefined;
  if (!config) throw new Error(`Unknown admin resource: ${name}`);
  return config;
}

// Rows leave as the database has them, minus nothing: the admin sees drafts too.
const rowsOf = (rows: unknown[]) => rows as Row[];

export async function listRows(db: Database, name: string): Promise<Row[]> {
  const { table } = resource(name);
  return rowsOf(
    await db.select().from(table).orderBy(asc(table.orderIndex), asc(table.id)),
  );
}

export async function getRow(
  db: Database,
  name: string,
  id: number,
): Promise<Row | null> {
  const { table } = resource(name);
  const [row] = await db.select().from(table).where(eq(table.id, id)).limit(1);
  return (row as Row | undefined) ?? null;
}

// New entries go to the end, and start unpublished so nothing half-written
// goes live (design.md §14.11).
export async function createRow(
  db: Database,
  name: string,
  input: unknown,
): Promise<{ ok: true; row: Row } | Failure> {
  const { table, schema: shape, published, defaults } = resource(name);
  const body =
    typeof input === "object" && input !== null
      ? {
          ...(published ? { isPublished: false } : {}),
          ...defaults,
          ...(input as object),
        }
      : input;
  const parsed = shape.safeParse(body);
  if (!parsed.success) {
    return {
      ok: false,
      status: 422,
      error: "invalid",
      fields: fieldErrors(parsed.error),
    };
  }

  try {
    const [{ top }] = await db
      .select({ top: max(table.orderIndex) })
      .from(table);
    const [row] = await db
      .insert(table)
      .values({ ...parsed.data, orderIndex: (Number(top) || 0) + 1 } as never)
      .returning();
    return { ok: true, row: row as Row };
  } catch (error) {
    const clash = uniqueViolation(error);
    if (clash) return clash;
    throw error;
  }
}

export async function updateRow(
  db: Database,
  name: string,
  id: number,
  input: unknown,
): Promise<{ ok: true; row: Row } | Failure> {
  const { table, schema: shape } = resource(name);
  const parsed = shape.partial().safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      status: 422,
      error: "invalid",
      fields: fieldErrors(parsed.error),
    };
  }
  if (Object.keys(parsed.data).length === 0) {
    return {
      ok: false,
      status: 422,
      error: "invalid",
      fields: { _: "Nothing to change." },
    };
  }

  try {
    const [row] = await db
      .update(table)
      .set(parsed.data as never)
      .where(eq(table.id, id))
      .returning();
    return row ? { ok: true, row: row as Row } : notFound;
  } catch (error) {
    const clash = uniqueViolation(error);
    if (clash) return clash;
    throw error;
  }
}

export async function deleteRow(
  db: Database,
  name: string,
  id: number,
): Promise<{ ok: true } | Failure> {
  const { table } = resource(name);
  const deleted = await db
    .delete(table)
    .where(eq(table.id, id))
    .returning({ id: table.id });
  return deleted.length > 0 ? { ok: true } : notFound;
}

// `ids` is the new order of some or all entries. They take the positions the
// same entries held before, in the new order, so a subset (a filtered list)
// reorders without disturbing the rest.
export async function reorderRows(
  db: Database,
  name: string,
  input: unknown,
): Promise<{ ok: true } | Failure> {
  const { table } = resource(name);
  const parsed = reorderSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      status: 422,
      error: "invalid",
      fields: fieldErrors(parsed.error),
    };
  }
  const { ids } = parsed.data;

  return db.transaction(async (tx) => {
    const current = (await tx
      .select({ id: table.id, order: table.orderIndex })
      .from(table)
      .where(inArray(table.id, ids))) as { id: number; order: number }[];
    if (current.length !== ids.length) return notFound;

    const slots = current.map((row) => row.order).sort((a, b) => a - b);
    // Entries that shared a position still get distinct ones.
    for (let i = 1; i < slots.length; i++) {
      if (slots[i] <= slots[i - 1]) slots[i] = slots[i - 1] + 1;
    }
    for (const [position, id] of ids.entries()) {
      await tx
        .update(table)
        .set({ orderIndex: slots[position] } as never)
        .where(eq(table.id, id));
    }
    return { ok: true } as const;
  });
}

// The profile is one row (`id = 1`): read it, change it, never list, add or delete.
export async function getProfile(db: Database): Promise<Row | null> {
  const [row] = await db
    .select()
    .from(schema.profile)
    .where(eq(schema.profile.id, 1))
    .limit(1);
  return (row as Row | undefined) ?? null;
}

export async function updateProfile(
  db: Database,
  input: unknown,
): Promise<{ ok: true; row: Row } | Failure> {
  const parsed = profileSchema.partial().safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      status: 422,
      error: "invalid",
      fields: fieldErrors(parsed.error),
    };
  }
  if (Object.keys(parsed.data).length === 0) {
    return {
      ok: false,
      status: 422,
      error: "invalid",
      fields: { _: "Nothing to change." },
    };
  }
  const [row] = await db
    .update(schema.profile)
    .set(parsed.data as never)
    .where(eq(schema.profile.id, 1))
    .returning();
  return row ? { ok: true, row: row as Row } : notFound;
}

// The newsletter's wording is one row (`id = 1`) that may not exist yet or hold
// blanks: reading gives the wording in use (stored, or the built-in one), and a
// change creates the row if needed.
export async function getNewsletter(
  db: Database,
): Promise<NewsletterSettings & { translations: Translations }> {
  const [row] = await db
    .select()
    .from(schema.newsletterSettings)
    .where(eq(schema.newsletterSettings.id, 1))
    .limit(1);
  // The French wording is returned beside the wording in use (docs/i18n.md §5).
  return { ...withDefaults(row), translations: row?.translations ?? {} };
}

export async function updateNewsletter(
  db: Database,
  input: unknown,
): Promise<
  | { ok: true; row: NewsletterSettings & { translations: Translations } }
  | Failure
> {
  const parsed = newsletterSchema.partial().safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      status: 422,
      error: "invalid",
      fields: fieldErrors(parsed.error),
    };
  }
  if (Object.keys(parsed.data).length === 0) {
    return {
      ok: false,
      status: 422,
      error: "invalid",
      fields: { _: "Nothing to change." },
    };
  }
  await db
    .insert(schema.newsletterSettings)
    .values({ id: 1, ...parsed.data })
    .onConflictDoUpdate({
      target: schema.newsletterSettings.id,
      set: parsed.data,
    });
  return { ok: true, row: await getNewsletter(db) };
}

// The creatives site's wording is one row (`id = 1`), like the newsletter's: reading
// gives the wording in use, a change creates the row if needed.
export async function getCreativesSettings(
  db: Database,
): Promise<CreativesSettings & { translations: Translations }> {
  const [row] = await db
    .select()
    .from(schema.creativesSettings)
    .where(eq(schema.creativesSettings.id, 1))
    .limit(1);
  return {
    ...withCreativesDefaults(row),
    translations: row?.translations ?? {},
  };
}

export async function updateCreativesSettings(
  db: Database,
  input: unknown,
): Promise<
  | { ok: true; row: CreativesSettings & { translations: Translations } }
  | Failure
> {
  const parsed = creativesSettingsSchema.partial().safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      status: 422,
      error: "invalid",
      fields: fieldErrors(parsed.error),
    };
  }
  if (Object.keys(parsed.data).length === 0) {
    return {
      ok: false,
      status: 422,
      error: "invalid",
      fields: { _: "Nothing to change." },
    };
  }
  await db
    .insert(schema.creativesSettings)
    .values({ id: 1, ...parsed.data })
    .onConflictDoUpdate({
      target: schema.creativesSettings.id,
      set: parsed.data,
    });
  return { ok: true, row: await getCreativesSettings(db) };
}
