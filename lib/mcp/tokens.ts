import { createHash, randomBytes } from "node:crypto";
import { and, desc, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import * as schema from "@/db/schema";
import type { Database } from "@/lib/db";
import { SCOPES, normalizeScopes, type Scope } from "./scopes";

// API tokens for agents (docs/mcp.md §3, D92). A token is `cmcp_` and 32 random bytes in
// base64url, shown once when it is created; only its SHA-256 hash and its first characters
// are stored, so a database leak gives nobody a working token.

const { agentTokens } = schema;

export const TOKEN_PREFIX = "cmcp_";
const SHOWN_PREFIX = 12; // `cmcp_` and 7 characters: enough to recognise it
const TOUCH_AFTER_MS = 60_000; // `last_used_at` is refreshed at most once a minute

export const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

export function generateToken(): string {
  return TOKEN_PREFIX + randomBytes(32).toString("base64url");
}

export const EXPIRIES = ["30", "90", "365", "never"] as const;

export const createTokenSchema = z
  .object({
    name: z
      .string({ error: "Name the token." })
      .trim()
      .min(1, "Name the token.")
      .max(60, "Keep the name under 60 characters."),
    scopes: z.array(z.enum(SCOPES), { error: "Choose what it may do." }).max(5),
    expires: z.enum(EXPIRIES, { error: "Choose when it expires." }),
  })
  .strict();

export type TokenRow = typeof agentTokens.$inferSelect;

/** What the admin may show of a token (never the hash). */
export type TokenView = {
  id: number;
  name: string;
  prefix: string;
  scopes: Scope[];
  expiresAt: string | null;
  revokedAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
};

const iso = (date: Date | null) => (date ? date.toISOString() : null);

export function toView(row: TokenRow): TokenView {
  return {
    id: row.id,
    name: row.name,
    prefix: row.prefix,
    scopes: normalizeScopes(row.scopes),
    expiresAt: iso(row.expiresAt),
    revokedAt: iso(row.revokedAt),
    lastUsedAt: iso(row.lastUsedAt),
    createdAt: row.createdAt.toISOString(),
  };
}

export type CreateResult =
  | { ok: true; token: string; view: TokenView }
  | { ok: false; fields: Record<string, string> };

export async function createToken(
  db: Database,
  input: unknown,
  now: Date = new Date(),
): Promise<CreateResult> {
  const parsed = createTokenSchema.safeParse(input);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "_");
      if (!(key in fields)) fields[key] = issue.message;
    }
    return { ok: false, fields };
  }
  const { name, scopes, expires } = parsed.data;
  const token = generateToken();
  const [row] = await db
    .insert(agentTokens)
    .values({
      name,
      tokenHash: hashToken(token),
      prefix: token.slice(0, SHOWN_PREFIX),
      scopes: normalizeScopes(scopes),
      expiresAt:
        expires === "never"
          ? null
          : new Date(now.getTime() + Number(expires) * 86_400_000),
    })
    .returning();
  return { ok: true, token, view: toView(row) };
}

export async function listTokens(db: Database): Promise<TokenView[]> {
  const rows = await db
    .select()
    .from(agentTokens)
    .orderBy(desc(agentTokens.createdAt), desc(agentTokens.id));
  return rows.map(toView);
}

/** Revokes a token (it stops working at once); false when there is no live token with that id. */
export async function revokeToken(
  db: Database,
  id: number,
  now: Date = new Date(),
): Promise<boolean> {
  const done = await db
    .update(agentTokens)
    .set({ revokedAt: now })
    .where(and(eq(agentTokens.id, id), isNull(agentTokens.revokedAt)))
    .returning({ id: agentTokens.id });
  return done.length > 0;
}

export type Verified =
  | { ok: true; token: { id: number; name: string; scopes: Scope[] } }
  | { ok: false; reason: "missing" | "invalid" | "revoked" | "expired" };

/** The bearer token of a request's `Authorization` header, if it looks like one of ours. */
export function bearerOf(header: string | null): string | null {
  const match = header?.match(/^Bearer\s+(\S+)$/i);
  return match && match[1].startsWith(TOKEN_PREFIX) ? match[1] : null;
}

export async function verifyToken(
  db: Database,
  bearer: string | null,
  now: Date = new Date(),
): Promise<Verified> {
  if (!bearer) return { ok: false, reason: "missing" };
  const [row] = await db
    .select()
    .from(agentTokens)
    .where(eq(agentTokens.tokenHash, hashToken(bearer)))
    .limit(1);
  if (!row) return { ok: false, reason: "invalid" };
  if (row.revokedAt) return { ok: false, reason: "revoked" };
  if (row.expiresAt && row.expiresAt <= now)
    return { ok: false, reason: "expired" };
  if (
    !row.lastUsedAt ||
    now.getTime() - row.lastUsedAt.getTime() > TOUCH_AFTER_MS
  )
    await db
      .update(agentTokens)
      .set({ lastUsedAt: now })
      .where(eq(agentTokens.id, row.id));
  return {
    ok: true,
    token: { id: row.id, name: row.name, scopes: normalizeScopes(row.scopes) },
  };
}
