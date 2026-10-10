import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { eq } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import * as schema from "@/db/schema";
import { seed } from "@/db/seed";
import type { Database } from "@/lib/db";
import { listActivity } from "./activity";
import { handleMcpRequest } from "./http";
import { resetLimits } from "./limits";
import { createToken, revokeToken } from "./tokens";

vi.mock("next/cache", () => ({
  revalidateTag: () => {},
  unstable_cache: (fn: unknown) => fn,
}));

let db: Database;
beforeAll(async () => {
  const instance = drizzle(new PGlite(), { schema });
  await migrate(instance, { migrationsFolder: "db/migrations" });
  db = instance;
  await seed(db);
}, 60_000);

beforeEach(async () => {
  await db.delete(schema.agentActivity);
  await db.delete(schema.agentTokens);
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

const rpc = (method: string, params: object = {}, id = 1) => ({
  jsonrpc: "2.0",
  id,
  method,
  params,
});

const post = (
  body: unknown,
  token?: string,
  extra: Record<string, string> = {},
) =>
  new Request("https://admin.example/mcp", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...extra,
    },
    body: JSON.stringify(body),
  });

async function token(scopes: string[] = ["write", "media"], name = "Agent") {
  const created = await createToken(db, { name, scopes, expires: "90" });
  if (!created.ok) throw new Error("token");
  resetLimits(created.view.id);
  return created;
}

describe("POST /mcp", () => {
  it("refuses a missing, unknown or revoked token with 401 and a way to fix it", async () => {
    const none = await handleMcpRequest(post(rpc("tools/list")), db);
    expect(none.status).toBe(401);
    expect(none.headers.get("www-authenticate")).toContain("Bearer");
    expect((await none.json()).message).toMatch(/Authorization: Bearer/);
    const wrong = await handleMcpRequest(
      post(rpc("tools/list"), "cmcp_nope"),
      db,
    );
    expect(wrong.status).toBe(401);
    const { token: secret, view } = await token();
    await revokeToken(db, view.id);
    const revoked = await handleMcpRequest(post(rpc("tools/list"), secret), db);
    expect(revoked.status).toBe(401);
    expect((await revoked.json()).message).toMatch(/revoked/);
  });

  it("answers GET and DELETE with 405", async () => {
    for (const method of ["GET", "DELETE"]) {
      const response = await handleMcpRequest(
        new Request("https://admin.example/mcp", { method }),
        db,
      );
      expect(response.status).toBe(405);
      expect(response.headers.get("allow")).toBe("POST");
    }
  });

  it("runs the MCP handshake and lists the tools of the token's scopes, as JSON", async () => {
    const { token: secret } = await token(["write"]);
    const init = await handleMcpRequest(
      post(
        rpc("initialize", {
          protocolVersion: "2025-06-18",
          capabilities: {},
          clientInfo: { name: "t", version: "1" },
        }),
        secret,
      ),
      db,
    );
    expect(init.status).toBe(200);
    expect(init.headers.get("content-type")).toContain("application/json");
    const initBody = await init.json();
    expect(initBody.result.serverInfo.name).toBe("chestlyace-admin");
    expect(initBody.result.instructions).toMatch(/whoami/);

    const list = await handleMcpRequest(
      post(rpc("tools/list", {}, 2), secret),
      db,
    );
    const names = (await list.json()).result.tools
      .map((t: { name: string }) => t.name)
      .sort();
    expect(names).toEqual(
      expect.arrayContaining([
        "whoami",
        "get_guide",
        "blog_create",
        "projects_create",
      ]),
    );
    expect(names).not.toContain("blog_publish");
    expect(names).not.toContain("projects_delete"); // no media scope
  });

  it("calls a tool, and logs it against the token", async () => {
    const { token: secret, view } = await token();
    const response = await handleMcpRequest(
      post(rpc("tools/call", { name: "whoami", arguments: {} }), secret),
      db,
    );
    const body = await response.json();
    expect(JSON.parse(body.result.content[0].text).token).toBe("Agent");
    const log = await listActivity(db);
    expect(log[0]).toMatchObject({
      tool: "whoami",
      ok: true,
      tokenId: view.id,
      tokenName: "Agent",
    });
  });

  it("limits a token to 120 requests a minute with a Retry-After", async () => {
    const { token: secret } = await token();
    let last: Response | undefined;
    for (let i = 0; i < 121; i++)
      last = await handleMcpRequest(post(rpc("ping", {}, i), secret), db);
    expect(last!.status).toBe(429);
    expect(Number(last!.headers.get("retry-after"))).toBeGreaterThan(0);
  });

  it("refuses a body that says it is over 12 MB", async () => {
    const { token: secret } = await token();
    const response = await handleMcpRequest(
      post(rpc("ping"), secret, { "content-length": String(13 * 1024 * 1024) }),
      db,
    );
    expect(response.status).toBe(413);
  });

  it("does not mix tokens: a token with fewer scopes never sees another's tools", async () => {
    const a = await token(["write", "media"], "A");
    const b = await token(["write"], "B");
    const listFor = async (secret: string) =>
      (
        await (
          await handleMcpRequest(post(rpc("tools/list"), secret), db)
        ).json()
      ).result.tools.length;
    expect(await listFor(a.token)).toBeGreaterThan(await listFor(b.token));
  });
});

describe("the media tools through the endpoint", () => {
  const PNG = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3, 4,
  ]);
  const PDF = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d, 1, 2]);

  const cloud = () => {
    vi.stubEnv("CLOUDINARY_CLOUD_NAME", "demo");
    vi.stubEnv("CLOUDINARY_API_KEY", "key");
    vi.stubEnv("CLOUDINARY_API_SECRET", "secret");
    const fetchMock = vi.fn().mockImplementation(async (url: string) =>
      Response.json({
        secure_url: `https://res.cloudinary.com/demo/${url.includes("/raw/") ? "raw" : "image"}/upload/v1/f`,
        width: 100,
        height: 50,
        bytes: 9,
        format: "x",
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
  };
  const call = async (secret: string, name: string, args: object) =>
    (
      await (
        await handleMcpRequest(
          post(rpc("tools/call", { name, arguments: args }), secret),
          db,
        )
      ).json()
    ).result;

  it("uploads a picture sent as base64 and returns what the content tools need", async () => {
    cloud();
    const { token: secret } = await token(["media"]);
    const result = await call(secret, "media_upload_base64", {
      use: "blog",
      filename: "cover.png",
      data: PNG.toString("base64"),
    });
    expect(result.isError).toBeFalsy();
    expect(JSON.parse(result.content[0].text)).toMatchObject({
      url: expect.stringContaining("res.cloudinary.com"),
      width: 100,
      height: 50,
    });
  });

  it("says what is wrong with a picture, in words an agent can use", async () => {
    cloud();
    const { token: secret } = await token(["media"]);
    const pdfAsImage = await call(secret, "media_upload_base64", {
      use: "project",
      filename: "x.png",
      data: PDF.toString("base64"),
    });
    expect(pdfAsImage.isError).toBe(true);
    expect(pdfAsImage.content[0].text).toMatch(/PDF.*project/);
    const badUse = await call(secret, "media_upload_base64", {
      use: "resume",
      filename: "x.png",
      data: "AAAA",
    });
    expect(badUse.isError).toBe(true); // `resume` is not a picture use
  });

  it("without the media scope the tools are not even there", async () => {
    const { token: secret } = await token(["write"]);
    const result = await call(secret, "media_upload_base64", {
      use: "blog",
      filename: "c.png",
      data: "AAAA",
    });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toMatch(/not found|unknown|Tool/i);
  });

  it("uploads the résumé and sets it as the English or the French one", async () => {
    cloud();
    const { token: secret } = await token(["write", "media"]);
    const en = await call(secret, "resume_upload", {
      data: PDF.toString("base64"),
      setAs: "en",
    });
    expect(en.isError).toBeFalsy();
    const [afterEn] = await db
      .select()
      .from(schema.profile)
      .where(eq(schema.profile.id, 1));
    expect(afterEn.resumeUrl).toContain("/raw/upload/");
    await db
      .update(schema.profile)
      .set({ translations: { fr: { headline: "Bonjour" } } })
      .where(eq(schema.profile.id, 1));
    const fr = await call(secret, "resume_upload", {
      data: PDF.toString("base64"),
      setAs: "fr",
    });
    expect(fr.isError).toBeFalsy();
    const [afterFr] = await db
      .select()
      .from(schema.profile)
      .where(eq(schema.profile.id, 1));
    expect(afterFr.translations.fr).toMatchObject({
      headline: "Bonjour",
      resumeUrl: expect.stringContaining("/raw/upload/"),
    });
    expect(afterFr.resumeUrl).toBe(afterEn.resumeUrl); // the English one untouched
  });

  it("needs write as well as media to set the résumé, and exactly one source", async () => {
    cloud();
    const { token: secret } = await token(["media"]);
    const noWrite = await call(secret, "resume_upload", {
      data: PDF.toString("base64"),
      setAs: "en",
    });
    expect(noWrite.isError).toBe(true);
    expect(noWrite.content[0].text).toMatch(/write scope/);
    const both = await call(secret, "resume_upload", {
      data: "AAAA",
      url: "https://example.com/a.pdf",
    });
    expect(both.isError).toBe(true);
    expect(both.content[0].text).toMatch(/either/);
    const plain = await call(secret, "resume_upload", {
      data: PDF.toString("base64"),
    });
    expect(plain.isError).toBeFalsy();
  });
});
