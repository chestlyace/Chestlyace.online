import { asc, eq, inArray, max } from "drizzle-orm";
import type { PgColumn, PgTable } from "drizzle-orm/pg-core";
import type { z } from "zod";
import * as schema from "@/db/schema";
import type { Database } from "@/lib/db";
import {
  certificationSchema,
  faqSchema,
  fieldErrors,
  reorderSchema,
  serviceSchema,
  skillSchema,
  socialSchema,
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
  faqs: {
    table: schema.faqs as unknown as AdminTable,
    schema: faqSchema,
    published: true,
  },
};

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
  const { table, schema: shape, published } = resource(name);
  const body =
    published && typeof input === "object" && input !== null
      ? { isPublished: false, ...(input as object) }
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

  const [{ top }] = await db.select({ top: max(table.orderIndex) }).from(table);
  const [row] = await db
    .insert(table)
    .values({ ...parsed.data, orderIndex: (Number(top) || 0) + 1 } as never)
    .returning();
  return { ok: true, row: row as Row };
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

  const [row] = await db
    .update(table)
    .set(parsed.data as never)
    .where(eq(table.id, id))
    .returning();
  return row ? { ok: true, row: row as Row } : notFound;
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
