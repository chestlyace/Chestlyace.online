import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { z } from "zod";
import * as schema from "@/db/schema";
import type { Database } from "@/lib/db";
import { SESSION_LIMITS, toolCount } from "@/lib/blog/session/types";

// Stores the agent sessions a post replays (docs/content-schema.md §4, design.md
// §13.48), apart from HTTP. The editor reads the file in the browser and sends
// only the redacted turns it was told to keep.

const text = (max: number) => z.string().max(max);

const tool = z.object({
  kind: z.literal("tool"),
  name: z.string().min(1).max(80),
  summary: text(300),
  input: text(SESSION_LIMITS.toolText + 100),
  output: text(SESSION_LIMITS.toolText + 100),
  failed: z.boolean(),
  edit: z
    .object({
      before: text(SESSION_LIMITS.toolText + 100),
      after: text(SESSION_LIMITS.toolText + 100),
    })
    .optional(),
});

const part = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("text"), text: text(SESSION_LIMITS.text) }),
  z.object({ kind: z.literal("thinking"), text: text(SESSION_LIMITS.text) }),
  tool,
]);

const turn = z.object({
  prompt: text(SESSION_LIMITS.text),
  parts: z.array(part).max(SESSION_LIMITS.parts),
  at: z.iso.datetime().nullable(),
});

export const sessionInput = z
  .object({
    title: z.string().trim().min(1).max(SESSION_LIMITS.title),
    turns: z.array(turn).min(1).max(SESSION_LIMITS.turns),
  })
  .strict();

export type SessionInfo = {
  id: string;
  title: string;
  turnCount: number;
  toolCallCount: number;
  startedAt: string | null;
};

export type CreateResult =
  { ok: true; session: SessionInfo } | { ok: false; fields: string[] };

const info = (row: typeof schema.agentSessions.$inferSelect): SessionInfo => ({
  id: row.id,
  title: row.title,
  turnCount: row.turnCount,
  toolCallCount: row.toolCallCount,
  startedAt: row.startedAt?.toISOString() ?? null,
});

export async function createSession(
  db: Database,
  input: unknown,
): Promise<CreateResult> {
  const parsed = sessionInput.safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      fields: [...new Set(parsed.error.issues.map((i) => String(i.path[0])))],
    };
  const { title, turns } = parsed.data;
  if (JSON.stringify(turns).length > SESSION_LIMITS.bytes)
    return { ok: false, fields: ["turns"] };

  const first = turns.find((t) => t.at)?.at ?? null;
  // A short id for the block; a clash is retried, and is very unlikely.
  for (let attempt = 0; attempt < 5; attempt++) {
    const [row] = await db
      .insert(schema.agentSessions)
      .values({
        id: randomBytes(4).toString("hex"),
        title,
        turns,
        turnCount: turns.length,
        toolCallCount: toolCount(turns),
        startedAt: first ? new Date(first) : null,
      })
      .onConflictDoNothing()
      .returning();
    if (row) return { ok: true, session: info(row) };
  }
  throw new Error("Could not find a free session id.");
}

export async function getSessionInfo(
  db: Database,
  id: string,
): Promise<SessionInfo | null> {
  const [row] = await db
    .select()
    .from(schema.agentSessions)
    .where(eq(schema.agentSessions.id, id));
  return row ? info(row) : null;
}
