import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import * as schema from "@/db/schema";
import { createPost } from "@/lib/admin/blogApi";
import { sharePost, unsharePost } from "@/lib/admin/shareApi";
import type { Database } from "@/lib/db";

// The endpoint against a real (in-process) database; Resend is stood in for by a
// stubbed fetch, and `after` runs at once.
const state = vi.hoisted(() => ({ db: null as unknown }));
vi.mock("@/lib/db", () => ({ getDb: () => state.db }));
vi.mock("@/lib/portfolio", () => ({
  getCachedHomepageData: async () => ({
    profile: { email: "owner@example.com" },
  }),
}));
vi.mock("next/server", async (original) => ({
  ...(await original<typeof import("next/server")>()),
  after: (task: () => Promise<void>) => task(),
}));

let db: Database;
beforeAll(async () => {
  const fresh = drizzle(new PGlite(), { schema });
  await migrate(fresh, { migrationsFolder: "db/migrations" });
  db = fresh;
  state.db = fresh;
}, 30_000);

type Handler = (
  request: Request,
  context: { params: Promise<{ token: string }> },
) => Promise<Response>;

let POST: Handler;
const fetchMock = vi.fn();
let token: string;
let postId: number;

beforeEach(async () => {
  await db.delete(schema.blogPosts);
  const created = await createPost(db, {
    title: "A draft",
    slug: "a-draft",
    description: "About it",
    content: "Words.",
  });
  if (!created.ok) throw new Error("create failed");
  postId = created.post.id;
  const shared = await sharePost(db, postId);
  if (!shared.ok) throw new Error("share failed");
  token = shared.share.token;

  vi.resetModules();
  fetchMock.mockReset().mockResolvedValue({ ok: true });
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("RESEND_API_KEY", "key");
  ({ POST } = (await import("./route")) as unknown as { POST: Handler });
});

const send = (
  body: Record<string, unknown>,
  options: { ip?: string; to?: string } = {},
) =>
  POST(
    new Request(`https://blog.example/api/blog/drafts/${token}/feedback`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": options.ip ?? "1.1.1.1",
      },
      body: JSON.stringify({
        name: "Ada",
        body: "Cut the intro.",
        lang: "en",
        website: "",
        elapsedMs: 5000,
        ...body,
      }),
    }),
    { params: Promise.resolve({ token: options.to ?? token }) },
  );

const stored = () => db.select().from(schema.blogDraftFeedback);

describe("POST /api/blog/drafts/<token>/feedback", () => {
  it("stores the feedback and emails the owner", async () => {
    const response = await send({ lang: "fr" });
    expect(response.status).toBe(201);
    expect(await stored()).toMatchObject([
      { postId, name: "Ada", body: "Cut the intro.", lang: "fr" },
    ]);
    expect(fetchMock).toHaveBeenCalledOnce();
    const mail = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(mail.to).toEqual(["owner@example.com"]);
    expect(mail.subject).toContain("A draft");
    expect(mail.text).toContain(`/blog/${postId}?tab=feedback`);
  });

  it("refuses a turned-off link, storing nothing", async () => {
    await unsharePost(db, postId);
    const response = await send({});
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "not-shared" });
    expect(await stored()).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("answers bad fields with their codes", async () => {
    const response = await send({ name: " ", body: "" });
    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({
      error: "invalid",
      fields: { name: "name-required", body: "body-required" },
    });
  });

  it("fakes success for a filled hidden field and refuses a too-quick send", async () => {
    expect((await send({ website: "spam.example" })).status).toBe(201);
    expect((await send({ elapsedMs: 200 })).status).toBe(400);
    expect(await stored()).toEqual([]);
  });

  it("refuses the same text twice in a row from one address", async () => {
    expect((await send({ body: "Same words." })).status).toBe(201);
    expect((await send({ body: "  same   WORDS. " })).status).toBe(409);
    expect((await send({ body: "Same words." }, { ip: "2.2.2.2" })).status).toBe(
      201,
    );
    expect(await stored()).toHaveLength(2);
  });

  it("allows 10 sends an hour per address and link", async () => {
    for (let n = 1; n <= 10; n++)
      expect((await send({ body: `Note ${n}` })).status).toBe(201);
    const blocked = await send({ body: "Note 11" });
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("Retry-After")).toMatch(/^\d+$/);
    expect((await send({ body: "Note 11" }, { ip: "3.3.3.3" })).status).toBe(
      201,
    );
  });
});
