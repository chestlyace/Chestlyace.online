import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as schema from "@/db/schema";
import { createSessionToken } from "@/lib/admin/session";
import type { Database } from "@/lib/db";
import { logActivity } from "./activity";
import { verifyToken } from "./tokens";

// The agent-access routes against a real (in-process) database, with the session
// cookie, the data cache and getDb stood in for.
const SECRET = "a-long-enough-secret-for-testing-0123456789";
let db: Database;
let signedIn = true;

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === "admin_session" && signedIn
        ? { value: createSessionToken(SECRET) }
        : undefined,
  }),
}));
vi.mock("next/cache", () => ({
  revalidateTag: () => {},
  unstable_cache: (fn: unknown) => fn,
}));
vi.mock("@/lib/db", async (original) => ({
  ...(await original<typeof import("@/lib/db")>()),
  getDb: () => db,
}));

const call = (path: string, method: string, body?: unknown) =>
  new Request(`https://admin.example${path}`, {
    method,
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
const ctx = (id: string) => ({ params: Promise.resolve({ id }) }) as never;

beforeEach(async () => {
  vi.stubEnv("SESSION_SECRET", SECRET);
  signedIn = true;
  const fresh = drizzle(new PGlite(), { schema });
  await migrate(fresh, { migrationsFolder: "db/migrations" });
  db = fresh;
});

const tokens = async () => await import("@/app/api/admin/agent/tokens/route");
const token = async () =>
  await import("@/app/api/admin/agent/tokens/[id]/route");
const activity = async () =>
  await import("@/app/api/admin/agent/activity/route");

describe("/api/admin/agent", () => {
  it("needs a session on every route", async () => {
    signedIn = false;
    const t = await tokens();
    expect((await t.GET(call("/api/admin/agent/tokens", "GET"))).status).toBe(
      401,
    );
    expect(
      (
        await t.POST(
          call("/api/admin/agent/tokens", "POST", {
            name: "x",
            scopes: [],
            expires: "90",
          }),
        )
      ).status,
    ).toBe(401);
    expect(
      (
        await (
          await token()
        ).DELETE(call("/api/admin/agent/tokens/1", "DELETE"), ctx("1"))
      ).status,
    ).toBe(401);
    expect(
      (await (await activity()).GET(call("/api/admin/agent/activity", "GET")))
        .status,
    ).toBe(401);
  });

  it("creates a token, shows the secret once, and lists it without the secret", async () => {
    const t = await tokens();
    const created = await t.POST(
      call("/api/admin/agent/tokens", "POST", {
        name: "Claude",
        scopes: ["write", "media"],
        expires: "90",
      }),
    );
    expect(created.status).toBe(201);
    const body = (await created.json()) as {
      token: string;
      item: { id: number; scopes: string[] };
    };
    expect(body.token).toMatch(/^cmcp_/);
    expect(body.item.scopes).toEqual(["read", "write", "media"]);
    expect((await verifyToken(db, body.token)).ok).toBe(true);

    const listed = await (
      await t.GET(call("/api/admin/agent/tokens", "GET"))
    ).json();
    expect(JSON.stringify(listed)).not.toContain(body.token);
    expect(JSON.stringify(listed)).not.toContain("tokenHash");
    expect((listed as { items: unknown[] }).items).toHaveLength(1);
  });

  it("answers a bad request with the fields to fix", async () => {
    const response = await (
      await tokens()
    ).POST(
      call("/api/admin/agent/tokens", "POST", {
        name: "",
        scopes: ["root"],
        expires: "1",
      }),
    );
    expect(response.status).toBe(422);
    const { fields } = (await response.json()) as {
      fields: Record<string, string>;
    };
    expect(Object.keys(fields).sort()).toEqual(["expires", "name", "scopes"]);
  });

  it("revokes a token at once, and 404s an unknown or already revoked one", async () => {
    const t = await tokens();
    const body = (await (
      await t.POST(
        call("/api/admin/agent/tokens", "POST", {
          name: "A",
          scopes: [],
          expires: "never",
        }),
      )
    ).json()) as { token: string; item: { id: number } };
    const { DELETE } = await token();
    expect(
      (await DELETE(call("/x", "DELETE"), ctx(String(body.item.id)))).status,
    ).toBe(200);
    expect((await verifyToken(db, body.token)).ok).toBe(false);
    expect(
      (await DELETE(call("/x", "DELETE"), ctx(String(body.item.id)))).status,
    ).toBe(404);
    expect((await DELETE(call("/x", "DELETE"), ctx("999"))).status).toBe(404);
    expect((await DELETE(call("/x", "DELETE"), ctx("abc"))).status).toBe(404);
  });

  it("lists the activity, newest first, and filters by token", async () => {
    await logActivity(db, {
      tokenId: null,
      tokenName: "A",
      tool: "one",
      ok: true,
    });
    await logActivity(db, {
      tokenId: null,
      tokenName: "B",
      tool: "two",
      ok: false,
      error: "nope",
    });
    const { GET } = await activity();
    const all = (await (
      await GET(call("/api/admin/agent/activity", "GET"))
    ).json()) as { items: { tool: string }[] };
    expect(all.items.map((i) => i.tool)).toEqual(["two", "one"]);
    const none = (await (
      await GET(call("/api/admin/agent/activity?token=5", "GET"))
    ).json()) as { items: unknown[] };
    expect(none.items).toEqual([]);
  });
});
