import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import * as schema from "@/db/schema";
import type { Database } from "@/lib/db";
import { logActivity, listActivity, KEEP_DAYS } from "./activity";
import { checkRequest, checkWrite, resetLimits } from "./limits";
import {
  bearerOf,
  createToken,
  generateToken,
  hashToken,
  listTokens,
  revokeToken,
  verifyToken,
} from "./tokens";

let db: Database;
beforeAll(async () => {
  const instance = drizzle(new PGlite(), { schema });
  await migrate(instance, { migrationsFolder: "db/migrations" });
  db = instance;
}, 30_000);

beforeEach(async () => {
  await db.delete(schema.agentActivity);
  await db.delete(schema.agentTokens);
});

const made = async (input: object = {}) => {
  const result = await createToken(db, {
    name: "Claude",
    scopes: ["write"],
    expires: "90",
    ...input,
  });
  if (!result.ok) throw new Error(JSON.stringify(result));
  return result;
};

describe("tokens", () => {
  it("makes unguessable tokens with a known prefix", () => {
    const a = generateToken();
    expect(a).toMatch(/^cmcp_[A-Za-z0-9_-]{43}$/);
    expect(generateToken()).not.toBe(a);
    expect(hashToken(a)).toMatch(/^[0-9a-f]{64}$/);
  });

  it("is shown once and stored only as a hash", async () => {
    const { token, view } = await made({ scopes: ["write", "media"] });
    expect(view.prefix).toBe(token.slice(0, 12));
    expect(view.scopes).toEqual(["read", "write", "media"]);
    const [row] = await db.select().from(schema.agentTokens);
    expect(row.tokenHash).toBe(hashToken(token));
    expect(JSON.stringify(row)).not.toContain(token);
    expect(JSON.stringify(await listTokens(db))).not.toContain(row.tokenHash);
    expect(JSON.stringify(await listTokens(db))).not.toContain(token);
  });

  it("refuses a bad request, naming each field", async () => {
    const result = await createToken(db, {
      name: " ",
      scopes: ["root"],
      expires: "7",
    });
    expect(result).toMatchObject({ ok: false });
    if (!result.ok)
      expect(Object.keys(result.fields).sort()).toEqual([
        "expires",
        "name",
        "scopes",
      ]);
    expect(
      (
        await createToken(db, {
          name: "x",
          scopes: [],
          expires: "never",
          extra: 1,
        })
      ).ok,
    ).toBe(false);
  });

  it("expires after the chosen days, or never", async () => {
    const now = new Date("2026-10-11T10:00:00Z");
    const { view } = await made({ expires: "30" });
    const forever = await made({ name: "Forever", expires: "never" });
    expect(forever.view.expiresAt).toBeNull();
    const created = await createToken(
      db,
      { name: "Dated", scopes: [], expires: "30" },
      now,
    );
    expect(created.ok && created.view.expiresAt).toBe(
      "2026-11-10T10:00:00.000Z",
    );
    expect(view.expiresAt).not.toBeNull();
  });
});

describe("verifying a token", () => {
  it("accepts a good token and says who it is", async () => {
    const { token, view } = await made({ scopes: ["write", "delete"] });
    expect(await verifyToken(db, token)).toEqual({
      ok: true,
      token: {
        id: view.id,
        name: "Claude",
        scopes: ["read", "write", "delete"],
      },
    });
  });

  it("says why it refuses: missing, unknown, revoked, expired", async () => {
    expect(await verifyToken(db, null)).toEqual({
      ok: false,
      reason: "missing",
    });
    expect(await verifyToken(db, "cmcp_nope")).toEqual({
      ok: false,
      reason: "invalid",
    });
    const { token, view } = await made({ expires: "30" });
    const later = new Date(Date.now() + 31 * 86_400_000);
    expect(await verifyToken(db, token, later)).toEqual({
      ok: false,
      reason: "expired",
    });
    expect(await revokeToken(db, view.id)).toBe(true);
    expect(await verifyToken(db, token)).toEqual({
      ok: false,
      reason: "revoked",
    });
    expect(await revokeToken(db, view.id)).toBe(false); // already revoked
    expect(await revokeToken(db, 99999)).toBe(false);
  });

  it("notes when it was last used, at most once a minute", async () => {
    const { token, view } = await made();
    const t0 = new Date("2026-10-11T10:00:00Z");
    await verifyToken(db, token, t0);
    await verifyToken(db, token, new Date(t0.getTime() + 10_000));
    let [row] = await db.select().from(schema.agentTokens);
    expect(row.lastUsedAt?.toISOString()).toBe(t0.toISOString());
    await verifyToken(db, token, new Date(t0.getTime() + 90_000));
    [row] = await db.select().from(schema.agentTokens);
    expect(row.lastUsedAt?.getTime()).toBe(t0.getTime() + 90_000);
    expect((await listTokens(db))[0].id).toBe(view.id);
  });

  it("reads the bearer token from a header, only one of ours", () => {
    expect(bearerOf("Bearer cmcp_abc")).toBe("cmcp_abc");
    expect(bearerOf("bearer cmcp_abc")).toBe("cmcp_abc");
    expect(bearerOf("Bearer something-else")).toBeNull();
    expect(bearerOf("Basic cmcp_abc")).toBeNull();
    expect(bearerOf(null)).toBeNull();
  });
});

describe("the activity log", () => {
  it("records a call, newest first, filtered by token, with long text cut", async () => {
    const a = await made({ name: "A" });
    const b = await made({ name: "B" });
    await logActivity(db, {
      tokenId: a.view.id,
      tokenName: "A",
      tool: "projects_create",
      ok: true,
      summary: "Created project x",
    });
    await logActivity(db, {
      tokenId: b.view.id,
      tokenName: "B",
      tool: "blog_post_delete",
      ok: false,
      error: "x".repeat(500),
    });
    const all = await listActivity(db);
    expect(all.map((row) => row.tool)).toEqual([
      "blog_post_delete",
      "projects_create",
    ]);
    expect(all[0].error?.length).toBe(300);
    expect(
      (await listActivity(db, { tokenId: a.view.id })).map((row) => row.tool),
    ).toEqual(["projects_create"]);
    expect(all[1].at).toMatch(/^\d{4}-\d\d-\d\dT/);
  });

  it("forgets rows older than 90 days when a new one is written, and keeps a deleted token's name", async () => {
    const old = new Date(Date.now() - (KEEP_DAYS + 1) * 86_400_000);
    await logActivity(
      db,
      { tokenId: null, tokenName: "Old", tool: "whoami", ok: true },
      old,
    );
    expect(await listActivity(db)).toHaveLength(1);
    await logActivity(db, {
      tokenId: null,
      tokenName: "New",
      tool: "whoami",
      ok: true,
    });
    expect((await listActivity(db)).map((row) => row.tokenName)).toEqual([
      "New",
    ]);
    const { view } = await made({ name: "Gone" });
    await logActivity(db, {
      tokenId: view.id,
      tokenName: "Gone",
      tool: "whoami",
      ok: true,
    });
    await db.delete(schema.agentTokens);
    const [row] = await listActivity(db);
    expect(row).toMatchObject({ tokenId: null, tokenName: "Gone" });
  });
});

describe("rate limits", () => {
  it("allows 120 requests and 30 writes a minute per token, each token on its own", () => {
    resetLimits(1);
    resetLimits(2);
    const now = 1_000_000;
    for (let i = 0; i < 30; i++) expect(checkWrite(1, now).allowed).toBe(true);
    const refused = checkWrite(1, now);
    expect(refused.allowed).toBe(false);
    expect(
      refused.allowed === false && refused.retryAfterSeconds,
    ).toBeGreaterThan(0);
    expect(checkWrite(2, now).allowed).toBe(true);
    for (let i = 0; i < 120; i++)
      expect(checkRequest(1, now).allowed).toBe(true);
    expect(checkRequest(1, now).allowed).toBe(false);
    expect(checkRequest(1, now + 61_000).allowed).toBe(true);
  });
});
