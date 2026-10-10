import { desc, eq, lt } from "drizzle-orm";
import * as schema from "@/db/schema";
import type { Database } from "@/lib/db";

// What agents did (docs/mcp.md §3): one row per tool call, shown in the admin's Activity
// screen and kept 90 days (older rows are removed whenever a new one is written).

const { agentActivity } = schema;

export const KEEP_DAYS = 90;

export type ActivityInput = {
  tokenId: number | null;
  tokenName: string;
  tool: string;
  ok: boolean;
  summary?: string;
  error?: string | null;
};

const cut = (text: string | null | undefined, max: number) =>
  text == null ? null : text.length > max ? `${text.slice(0, max - 1)}…` : text;

export async function logActivity(
  db: Database,
  entry: ActivityInput,
  now: Date = new Date(),
): Promise<void> {
  await db.insert(agentActivity).values({
    tokenId: entry.tokenId,
    tokenName: entry.tokenName,
    tool: entry.tool,
    ok: entry.ok,
    summary: cut(entry.summary ?? "", 200) ?? "",
    error: cut(entry.error, 300),
    at: now,
  });
  await db
    .delete(agentActivity)
    .where(
      lt(agentActivity.at, new Date(now.getTime() - KEEP_DAYS * 86_400_000)),
    );
}

export type ActivityView = {
  id: number;
  tokenId: number | null;
  tokenName: string;
  tool: string;
  ok: boolean;
  summary: string;
  error: string | null;
  at: string;
};

/** The latest calls, newest first, optionally of one token. */
export async function listActivity(
  db: Database,
  options: { tokenId?: number; limit?: number } = {},
): Promise<ActivityView[]> {
  const query = db.select().from(agentActivity);
  const rows = await (
    options.tokenId
      ? query.where(eq(agentActivity.tokenId, options.tokenId))
      : query
  )
    .orderBy(desc(agentActivity.at), desc(agentActivity.id))
    .limit(options.limit ?? 200);
  return rows.map((row) => ({ ...row, at: row.at.toISOString() }));
}
