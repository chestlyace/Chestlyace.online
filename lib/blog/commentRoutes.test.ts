import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as schema from "@/db/schema";
import { seed } from "@/db/seed";
import type { Database } from "@/lib/db";
import type { Reader } from "./auth";

// The comment routes against a real (in-process) database, with who is signed in,
// the owner's email and the clock of `after` stood in for.
let db: Database;
let reader: Reader | null = null;
const emails: unknown[] = [];
const pending: Promise<void>[] = [];
const settled = async () => void (await Promise.all(pending.splice(0)));

vi.mock("@/lib/db", async (original) => ({
  ...(await original<typeof import("@/lib/db")>()),
  getDb: () => db,
}));
vi.mock("./auth", () => ({
  getReader: async () => reader,
  configuredProviders: () => ["github", "google"],
}));
vi.mock("@/lib/portfolio", () => ({
  getCachedHomepageData: async () => ({
    profile: { email: "owner@example.com" },
  }),
}));
vi.mock("next/server", async (original) => ({
  ...(await original<typeof import("next/server")>()),
  after: (task: () => Promise<void>) => void pending.push(task()),
}));

const ADA: Reader = {
  id: "u1",
  name: "Ada",
  image: null,
  banned: false,
  isAuthor: false,
};
const call = (
  path: string,
  method = "GET",
  body?: unknown,
  headers: Record<string, string> = {},
) =>
  new Request(`https://blog.example${path}`, {
    method,
    headers: { "content-type": "application/json", ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
const ctx = (params: object) => ({ params: Promise.resolve(params) }) as never;

beforeEach(async () => {
  vi.stubEnv("RESEND_API_KEY", "re_test");
  vi.stubGlobal(
    "fetch",
    vi.fn(async (_url: unknown, init?: RequestInit) => {
      emails.push(JSON.parse(String(init?.body)));
      return new Response("{}", { status: 200 });
    }),
  );
  emails.length = 0;
  pending.length = 0;
  reader = ADA;
  const fresh = drizzle(new PGlite(), { schema });
  await migrate(fresh, { migrationsFolder: "db/migrations" });
  db = fresh;
  await seed(db);
  for (const id of ["u1", "u2", "u9", "owner"])
    await db.insert(schema.readerUser).values({
      id,
      name: id,
      email: `${id}@example.com`,
      isAuthor: id === "owner",
    });
}, 30_000);

const comments = () => import("@/app/api/blog/posts/[slug]/comments/route");
const one = () => import("@/app/api/blog/comments/[id]/route");
const like = () => import("@/app/api/blog/comments/[id]/like/route");
const report = () => import("@/app/api/blog/comments/[id]/report/route");
const PATH = "/api/blog/posts/hello-world/comments";

describe("posting", () => {
  it("needs an account that isn't banned, and a request from this site", async () => {
    const { POST } = await comments();
    reader = null;
    expect(
      (
        await POST(
          call(PATH, "POST", { body: "hi" }),
          ctx({ slug: "hello-world" }),
        )
      ).status,
    ).toBe(401);
    reader = { ...ADA, banned: true };
    expect(
      (
        await POST(
          call(PATH, "POST", { body: "hi" }),
          ctx({ slug: "hello-world" }),
        )
      ).status,
    ).toBe(403);
    reader = ADA;
    expect(
      (
        await POST(
          call(
            PATH,
            "POST",
            { body: "hi" },
            { origin: "https://evil.example" },
          ),
          ctx({ slug: "hello-world" }),
        )
      ).status,
    ).toBe(403);
    expect(await db.select().from(schema.blogComments)).toHaveLength(0);
  });

  it("posts at once, emails the owner, and shows in the list with who is reading", async () => {
    const { POST, GET } = await comments();
    const response = await POST(
      call(PATH, "POST", { body: "Nice **post**" }),
      ctx({ slug: "hello-world" }),
    );
    expect(response.status).toBe(201);
    expect((await response.json()).comment).toMatchObject({
      body: "Nice **post**",
      mine: true,
    });
    await settled();
    expect(emails).toHaveLength(1);
    expect(emails[0]).toMatchObject({
      to: ["owner@example.com"],
      subject: expect.stringContaining("Ada"),
    });
    const list = await (
      await GET(call(PATH), ctx({ slug: "hello-world" }))
    ).json();
    expect(list).toMatchObject({
      total: 1,
      enabled: true,
      maxWords: 120,
      reader: { id: "u1" },
    });
    expect(list.items[0].body).toBe("Nice **post**");
  });

  it("does not email the owner about their own comment; says what is wrong with a bad one", async () => {
    const { POST } = await comments();
    reader = { ...ADA, id: "owner", name: "Chestly", isAuthor: true };
    expect(
      (
        await POST(
          call(PATH, "POST", { body: "Thanks all" }),
          ctx({ slug: "hello-world" }),
        )
      ).status,
    ).toBe(201);
    await settled();
    expect(emails).toHaveLength(0);
    reader = ADA;
    const long = await POST(
      call(PATH, "POST", { body: "word ".repeat(130) }),
      ctx({ slug: "hello-world" }),
    );
    expect(long.status).toBe(422);
    expect((await long.json()).message).toMatch(/120 words/);
    expect(
      (
        await POST(
          call(PATH, "POST", { nope: 1 }),
          ctx({ slug: "hello-world" }),
        )
      ).status,
    ).toBe(422);
    expect(
      (
        await POST(
          call("/api/blog/posts/x/comments", "POST", { body: "hi" }),
          ctx({ slug: "x" }),
        )
      ).status,
    ).toBe(404);
  });

  it("reads COMMENT_MAX_WORDS", async () => {
    vi.stubEnv("COMMENT_MAX_WORDS", "3");
    const { POST } = await comments();
    expect(
      (
        await POST(
          call(PATH, "POST", { body: "one two three four" }),
          ctx({ slug: "hello-world" }),
        )
      ).status,
    ).toBe(422);
    expect(
      (
        await POST(
          call(PATH, "POST", { body: "one two three" }),
          ctx({ slug: "hello-world" }),
        )
      ).status,
    ).toBe(201);
    vi.stubEnv("COMMENT_MAX_WORDS", "");
  });
});

describe("liking, reporting and deleting", () => {
  it("each needs an account; a reader deletes only their own", async () => {
    const { POST } = await comments();
    // a reader the other tests have not used, so the posting limit is fresh
    reader = { ...ADA, id: "u9" };
    const made = await (
      await POST(
        call(PATH, "POST", { body: "Mine" }),
        ctx({ slug: "hello-world" }),
      )
    ).json();
    const id = String(made.comment.id);
    reader = { ...ADA, id: "u2" };
    expect(
      await (await (await like()).POST(call("/x", "POST"), ctx({ id }))).json(),
    ).toEqual({ count: 1, liked: true });
    expect(
      (await (await report()).POST(call("/x", "POST"), ctx({ id }))).status,
    ).toBe(200);
    expect(
      (await (await one()).DELETE(call("/x", "DELETE"), ctx({ id }))).status,
    ).toBe(404);
    reader = null;
    expect(
      (await (await like()).POST(call("/x", "POST"), ctx({ id }))).status,
    ).toBe(401);
    expect(
      (await (await report()).POST(call("/x", "POST"), ctx({ id }))).status,
    ).toBe(401);
    reader = { ...ADA, id: "u9" };
    expect(
      (await (await report()).POST(call("/x", "POST"), ctx({ id }))).status,
    ).toBe(422);
    expect(
      (await (await one()).DELETE(call("/x", "DELETE"), ctx({ id }))).status,
    ).toBe(200);
    expect(
      (await (await like()).POST(call("/x", "POST"), ctx({ id: "abc" })))
        .status,
    ).toBe(404);
  });
});
