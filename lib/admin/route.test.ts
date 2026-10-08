import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { eq } from "drizzle-orm";
import { migrate } from "drizzle-orm/pglite/migrator";

import { beforeEach, describe, expect, it, vi } from "vitest";
import * as schema from "@/db/schema";
import { seed } from "@/db/seed";
import type { Database } from "@/lib/db";
import { createSessionToken } from "./session";

// The route handlers against a real (in-process) database, with the session
// cookie, the data cache and getDb stood in for.
const SECRET = "a-long-enough-secret-for-testing-0123456789";
let db: Database;
let signedIn = true;
const revalidate = vi.fn();

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === "admin_session" && signedIn
        ? { value: createSessionToken(SECRET) }
        : undefined,
  }),
}));
vi.mock("next/cache", () => ({
  revalidateTag: (...args: unknown[]) => revalidate(...args),
  unstable_cache: (fn: unknown) => fn,
}));
vi.mock("@/lib/db", async (original) => ({
  ...(await original<typeof import("@/lib/db")>()),
  getDb: () => db,
}));

const call = (
  path: string,
  method: string,
  body?: unknown,
  headers: Record<string, string> = {},
) =>
  new Request(`https://admin.example${path}`, {
    method,
    headers: { "content-type": "application/json", ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

beforeEach(async () => {
  vi.stubEnv("SESSION_SECRET", SECRET);
  revalidate.mockClear();
  signedIn = true;
  const fresh = drizzle(new PGlite(), { schema });
  await migrate(fresh, { migrationsFolder: "db/migrations" });
  db = fresh;
  await seed(db);
});

const list = async () => await import("@/app/api/admin/[resource]/route");
const one = async () => await import("@/app/api/admin/[resource]/[id]/route");
const reorder = async () =>
  await import("@/app/api/admin/[resource]/reorder/route");
const ctx = <T extends object>(params: T) => ({
  params: Promise.resolve(params),
});

describe("/api/admin/<resource>", () => {
  it("needs a session", async () => {
    signedIn = false;
    const { GET, POST } = await list();
    expect(
      (
        await GET(
          call("/api/admin/faqs", "GET"),
          ctx({ resource: "faqs" }) as never,
        )
      ).status,
    ).toBe(401);
    expect(
      (
        await POST(
          call("/api/admin/faqs", "POST", {}),
          ctx({ resource: "faqs" }) as never,
        )
      ).status,
    ).toBe(401);
    expect(revalidate).not.toHaveBeenCalled();
  });

  it("lists entries, and 404s an unknown resource", async () => {
    const { GET } = await list();
    const ok = await GET(
      call("/api/admin/faqs", "GET"),
      ctx({ resource: "faqs" }) as never,
    );
    expect(ok.status).toBe(200);
    expect(((await ok.json()) as { items: unknown[] }).items).toHaveLength(2);
    for (const resource of ["nope", "profile", "__proto__"]) {
      expect(
        (
          await GET(
            call(`/api/admin/${resource}`, "GET"),
            ctx({ resource }) as never,
          )
        ).status,
      ).toBe(404);
    }
  });

  it("creates, revalidates the public site, and says what is wrong with a bad body", async () => {
    const { POST } = await list();
    const created = await POST(
      call("/api/admin/faqs", "POST", { question: "New?", answer: "Yes." }),
      ctx({ resource: "faqs" }) as never,
    );
    expect(created.status).toBe(201);
    expect(
      ((await created.json()) as { item: { isPublished: boolean } }).item
        .isPublished,
    ).toBe(false);
    expect(revalidate).toHaveBeenCalledWith("portfolio", { expire: 0 });

    revalidate.mockClear();
    const bad = await POST(
      call("/api/admin/faqs", "POST", { question: "" }),
      ctx({ resource: "faqs" }) as never,
    );
    expect(bad.status).toBe(422);
    const body = (await bad.json()) as {
      error: string;
      fields: Record<string, string>;
    };
    expect(body.error).toBe("invalid");
    expect(Object.keys(body.fields).sort()).toEqual(["answer", "question"]);
    expect(revalidate).not.toHaveBeenCalled();
  });

  it("refuses other origins, non-JSON bodies and broken JSON", async () => {
    const { POST } = await list();
    const origin = await POST(
      call(
        "/api/admin/faqs",
        "POST",
        { question: "Q", answer: "A" },
        { origin: "https://evil.example" },
      ),
      ctx({ resource: "faqs" }) as never,
    );
    expect(origin.status).toBe(403);
    const type = await POST(
      call("/api/admin/faqs", "POST", undefined, {
        "content-type": "text/plain",
      }),
      ctx({ resource: "faqs" }) as never,
    );
    expect(type.status).toBe(415);
    const broken = await POST(
      new Request("https://admin.example/api/admin/faqs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{nope",
      }),
      ctx({ resource: "faqs" }) as never,
    );
    expect(broken.status).toBe(422);
  });
});

describe("/api/admin/<resource>/<id>", () => {
  it("updates, deletes and 404s", async () => {
    const { GET } = await list();
    const items = (
      (await (
        await GET(
          call("/api/admin/skills", "GET"),
          ctx({ resource: "skills" }) as never,
        )
      ).json()) as { items: { id: number }[] }
    ).items;
    const id = items[0].id;
    const { PATCH, DELETE } = await one();

    const patched = await PATCH(
      call(`/api/admin/skills/${id}`, "PATCH", { isPublished: false }),
      ctx({ resource: "skills", id: String(id) }) as never,
    );
    expect(patched.status).toBe(200);
    expect(revalidate).toHaveBeenCalledTimes(1);

    const gone = await DELETE(
      call(`/api/admin/skills/${id}`, "DELETE"),
      ctx({ resource: "skills", id: String(id) }) as never,
    );
    expect(gone.status).toBe(200);
    expect(revalidate).toHaveBeenCalledTimes(2);
    expect(
      (
        await DELETE(
          call(`/api/admin/skills/${id}`, "DELETE"),
          ctx({ resource: "skills", id: String(id) }) as never,
        )
      ).status,
    ).toBe(404);
    for (const bad of ["abc", "0", "-1", "1e3", "99999999999999"]) {
      expect(
        (
          await PATCH(
            call(`/api/admin/skills/${bad}`, "PATCH", { isPublished: true }),
            ctx({ resource: "skills", id: bad }) as never,
          )
        ).status,
      ).toBe(404);
    }
  });
});

describe("/api/admin/<resource>/reorder", () => {
  it("reorders and revalidates", async () => {
    const { GET } = await list();
    const items = (
      (await (
        await GET(
          call("/api/admin/faqs", "GET"),
          ctx({ resource: "faqs" }) as never,
        )
      ).json()) as { items: { id: number }[] }
    ).items;
    const { POST } = await reorder();
    const response = await POST(
      call("/api/admin/faqs/reorder", "POST", {
        ids: items.map((i) => i.id).reverse(),
      }),
      ctx({ resource: "faqs" }) as never,
    );
    expect(response.status).toBe(200);
    expect(revalidate).toHaveBeenCalledTimes(1);
    const after = (
      (await (
        await GET(
          call("/api/admin/faqs", "GET"),
          ctx({ resource: "faqs" }) as never,
        )
      ).json()) as { items: { id: number }[] }
    ).items;
    expect(after.map((i) => i.id)).toEqual(items.map((i) => i.id).reverse());
    expect(
      (
        await POST(
          call("/api/admin/faqs/reorder", "POST", { ids: [1, 99999] }),
          ctx({ resource: "faqs" }) as never,
        )
      ).status,
    ).toBe(404);
  });
});

describe("/api/admin/upload-signature", () => {
  const sign = async (body: unknown) => {
    const { POST } = await import("@/app/api/admin/upload-signature/route");
    return POST(call("/api/admin/upload-signature", "POST", body));
  };

  it("needs a session", async () => {
    signedIn = false;
    expect((await sign({ use: "project" })).status).toBe(401);
  });

  it("says 503 when Cloudinary isn't set up", async () => {
    vi.stubEnv("CLOUDINARY_CLOUD_NAME", "");
    expect((await sign({ use: "project" })).status).toBe(503);
  });

  it("signs an upload without revealing the secret, and refuses unknown uses", async () => {
    vi.stubEnv("CLOUDINARY_CLOUD_NAME", "demo");
    vi.stubEnv("CLOUDINARY_API_KEY", "123");
    vi.stubEnv("CLOUDINARY_API_SECRET", "topsecret");
    const response = await sign({ use: "logo" });
    expect(response.status).toBe(200);
    const text = JSON.stringify(await response.json());
    expect(text).toContain("portfolio/journey");
    expect(text).not.toContain("topsecret");
    expect((await sign({ use: "../../etc" })).status).toBe(422);
    expect((await sign({ use: "logo", folder: "x" })).status).toBe(422);
    expect(revalidate).not.toHaveBeenCalled();
  });
});

describe("/api/admin/blog", () => {
  const posts = async () => await import("@/app/api/admin/blog/route");
  const post = async () => await import("@/app/api/admin/blog/[id]/route");
  const copy = async () =>
    await import("@/app/api/admin/blog/[id]/duplicate/route");

  it("needs a session and a same-origin write", async () => {
    const { GET, POST } = await posts();
    signedIn = false;
    expect((await GET(call("/api/admin/blog", "GET"))).status).toBe(401);
    signedIn = true;
    const foreign = await POST(
      call(
        "/api/admin/blog",
        "POST",
        { title: "A", slug: "a" },
        { origin: "https://evil.example" },
      ),
    );
    expect(foreign.status).toBe(403);
    expect(revalidate).not.toHaveBeenCalled();
  });

  it("creates, lists, updates, duplicates and deletes, revalidating the blog", async () => {
    const { GET, POST } = await posts();
    const created = await POST(
      call("/api/admin/blog", "POST", {
        title: "Hello again",
        slug: "hello-again",
      }),
    );
    expect(created.status).toBe(201);
    const { item } = (await created.json()) as { item: { id: number } };
    expect(revalidate).toHaveBeenCalledWith("blog", { expire: 0 });

    const listed = (await (
      await GET(call("/api/admin/blog", "GET"))
    ).json()) as {
      items: { slug: string }[];
    };
    expect(listed.items.map((p) => p.slug)).toContain("hello-again");

    const { GET: read, PATCH, DELETE } = await post();
    const target = ctx({ id: String(item.id) }) as never;
    expect((await read(call("/api/admin/blog/1", "GET"), target)).status).toBe(
      200,
    );
    const bad = await PATCH(
      call("/api/admin/blog/1", "PATCH", { slug: "api" }),
      target,
    );
    expect(bad.status).toBe(422);
    const ok = await PATCH(
      call("/api/admin/blog/1", "PATCH", { title: "Renamed" }),
      target,
    );
    expect(ok.status).toBe(200);

    const { POST: duplicate } = await copy();
    const dup = await duplicate(
      call("/api/admin/blog/1/duplicate", "POST"),
      target,
    );
    expect(dup.status).toBe(201);

    expect(
      (await DELETE(call("/api/admin/blog/1", "DELETE"), target)).status,
    ).toBe(200);
    expect(
      (await DELETE(call("/api/admin/blog/1", "DELETE"), target)).status,
    ).toBe(404);
    expect(
      (await read(call("/api/admin/blog/x", "GET"), ctx({ id: "x" }) as never))
        .status,
    ).toBe(404);
  });
});

describe("/api/admin/blog/devto", () => {
  const status = async () =>
    await import("@/app/api/admin/blog/devto/status/route");
  const find = async () =>
    await import("@/app/api/admin/blog/devto/find/route");
  const importer = async () =>
    await import("@/app/api/admin/blog/devto/import/route");
  const exporter = async () =>
    await import("@/app/api/admin/blog/[id]/devto/route");

  const dev = (
    handler: (url: string, init?: RequestInit) => unknown,
    code = 200,
  ) =>
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async (url: RequestInfo | URL, init?: RequestInit) =>
          new Response(JSON.stringify(handler(String(url), init)), {
            status: code,
          }),
      ),
    );

  it("needs a session, and says whether the key is set without showing it", async () => {
    const { GET } = await status();
    signedIn = false;
    expect(
      (await GET(call("/api/admin/blog/devto/status", "GET"))).status,
    ).toBe(401);
    signedIn = true;
    vi.stubEnv("DEVTO_API_KEY", "");
    expect(
      await (await GET(call("/api/admin/blog/devto/status", "GET"))).json(),
    ).toEqual({ configured: false });
    vi.stubEnv("DEVTO_API_KEY", "secret-key");
    const reply = await (
      await GET(call("/api/admin/blog/devto/status", "GET"))
    ).json();
    expect(reply).toEqual({ configured: true });
  });

  it("finds, imports and exports with DEV standing in", async () => {
    const articles = [
      { id: 5, title: "From DEV", url: "https://dev.to/me/x", tag_list: ["a"] },
    ];
    dev((url) =>
      /\/articles\/5$/.test(url)
        ? {
            id: 5,
            title: "From DEV",
            description: "d",
            body_markdown: "Body",
            url: "https://dev.to/me/x",
          }
        : articles,
    );

    const found = await (
      await (
        await find()
      ).POST(call("/api/admin/blog/devto/find", "POST", { username: "me" }))
    ).json();
    expect(found.items).toEqual([
      expect.objectContaining({ id: 5, imported: false }),
    ]);
    expect(
      (
        await (
          await find()
        ).POST(call("/api/admin/blog/devto/find", "POST", {}))
      ).status,
    ).toBe(422);

    const imported = await (
      await (
        await importer()
      ).POST(call("/api/admin/blog/devto/import", "POST", { ids: [5] }))
    ).json();
    expect(imported.items[0]).toMatchObject({ status: "imported" });
    expect(
      (
        await (
          await importer()
        ).POST(call("/api/admin/blog/devto/import", "POST", { ids: [] }))
      ).status,
    ).toBe(422);

    const postId = imported.items[0].postId;
    const target = ctx({ id: String(postId) }) as never;
    const { POST } = await exporter();
    vi.stubEnv("DEVTO_API_KEY", "");
    expect(
      (
        await POST(
          call(`/api/admin/blog/${postId}/devto`, "POST", { publish: false }),
          target,
        )
      ).status,
    ).toBe(400);
    vi.stubEnv("DEVTO_API_KEY", "secret-key");
    dev(() => ({ id: 9, url: "https://dev.to/me/new" }));
    await db
      .update(schema.blogPosts)
      .set({ devtoId: null })
      .where(eq(schema.blogPosts.id, postId));
    const sent = await POST(
      call(`/api/admin/blog/${postId}/devto`, "POST", { publish: false }),
      target,
    );
    expect(await sent.json()).toMatchObject({
      url: "https://dev.to/me/new",
      created: true,
    });
    expect(
      (
        await POST(
          call(`/api/admin/blog/${postId}/devto`, "POST", { nope: 1 }),
          target,
        )
      ).status,
    ).toBe(422);
    vi.unstubAllGlobals();
  });
});

describe("/api/blog/posts/<slug>/like", () => {
  const like = async () =>
    await import("@/app/api/blog/posts/[slug]/like/route");
  const slug = (value: string) => ctx({ slug: value }) as never;
  const post = (path: string, headers: Record<string, string> = {}) =>
    new Request(`https://blog.example${path}`, { method: "POST", headers });

  it("likes and unlikes with a cookie that only the browser holds, and answers 404 for no post", async () => {
    const { GET, POST } = await like();
    const first = await POST(
      post("/api/blog/posts/hello-world/like"),
      slug("hello-world"),
    );
    expect(first.status).toBe(200);
    expect(await first.json()).toEqual({ count: 1, liked: true });
    const cookie = first.headers.get("set-cookie") ?? "";
    expect(cookie).toMatch(/blog_visitor=/);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=lax/i);

    expect(
      (await POST(post("/api/blog/posts/nope/like"), slug("nope"))).status,
    ).toBe(404);
    expect(
      (await GET(new Request("https://blog.example/x"), slug("nope"))).status,
    ).toBe(404);
    expect(
      await (
        await GET(new Request("https://blog.example/x"), slug("hello-world"))
      ).json(),
    ).toEqual({ count: 1, liked: false });
  });

  it("refuses a request from another site", async () => {
    const { POST } = await like();
    const response = await POST(
      post("/api/blog/posts/hello-world/like", {
        origin: "https://evil.example",
      }),
      slug("hello-world"),
    );
    expect(response.status).toBe(403);
  });
});

describe("/api/admin/blog/comments and readers", () => {
  const list = async () => await import("@/app/api/admin/blog/comments/route");
  const comment = async () =>
    await import("@/app/api/admin/blog/comments/[id]/route");
  const readerRoute = async () =>
    await import("@/app/api/admin/blog/readers/[id]/route");

  it("need a session and a same-origin write", async () => {
    signedIn = false;
    expect(
      (await (await list()).GET(call("/api/admin/blog/comments", "GET")))
        .status,
    ).toBe(401);
    signedIn = true;
    const forged = await (
      await comment()
    ).PATCH(
      call(
        "/api/admin/blog/comments/1",
        "PATCH",
        { status: "hidden" },
        { origin: "https://evil.example" },
      ),
      ctx({ id: "1" }) as never,
    );
    expect(forged.status).toBe(403);
  });

  it("hide, show, delete and ban, revalidating the blog", async () => {
    const [post] = await db
      .select({ id: schema.blogPosts.id })
      .from(schema.blogPosts);
    await db
      .insert(schema.readerUser)
      .values({ id: "rx", name: "Rex", email: "rx@x.test" });
    const [made] = await db
      .insert(schema.blogComments)
      .values({ postId: post.id, userId: "rx", body: "Hi" })
      .returning({ id: schema.blogComments.id });
    const id = String(made.id);

    const listed = await (
      await (
        await list()
      ).GET(call("/api/admin/blog/comments?filter=all", "GET"))
    ).json();
    expect(listed.items[0]).toMatchObject({
      body: "Hi",
      reader: { name: "Rex" },
    });

    const { PATCH, DELETE } = await comment();
    expect(
      (
        await PATCH(
          call("/x", "PATCH", { status: "hidden" }),
          ctx({ id }) as never,
        )
      ).status,
    ).toBe(200);
    expect(revalidate).toHaveBeenCalledWith("blog", { expire: 0 });
    expect(
      (
        await PATCH(
          call("/x", "PATCH", { status: "nope" }),
          ctx({ id }) as never,
        )
      ).status,
    ).toBe(422);
    expect(
      (
        await PATCH(
          call("/x", "PATCH", { status: "hidden" }),
          ctx({ id: "9999" }) as never,
        )
      ).status,
    ).toBe(404);
    const hidden = await (
      await (
        await list()
      ).GET(call("/api/admin/blog/comments?filter=hidden", "GET"))
    ).json();
    expect(hidden.items).toHaveLength(1);

    const ban = (await readerRoute()).PATCH;
    expect(
      (
        await ban(
          call("/x", "PATCH", { banned: true }),
          ctx({ id: "rx" }) as never,
        )
      ).status,
    ).toBe(200);
    expect(
      (await ban(call("/x", "PATCH", {}), ctx({ id: "rx" }) as never)).status,
    ).toBe(422);
    expect(
      (
        await ban(
          call("/x", "PATCH", { banned: true }),
          ctx({ id: "nobody" }) as never,
        )
      ).status,
    ).toBe(404);
    expect(
      (await DELETE(call("/x", "DELETE"), ctx({ id }) as never)).status,
    ).toBe(200);
    expect(
      (await DELETE(call("/x", "DELETE"), ctx({ id }) as never)).status,
    ).toBe(404);
  });
});

describe("/api/admin/blog/sessions", () => {
  const create = async () =>
    await import("@/app/api/admin/blog/sessions/route");
  const one = async () =>
    await import("@/app/api/admin/blog/sessions/[id]/route");
  const turns = [
    {
      prompt: "Fix it",
      at: "2026-10-07T10:00:00.000Z",
      parts: [
        { kind: "text", text: "Done" },
        {
          kind: "tool",
          name: "Bash",
          summary: "pnpm test",
          input: "pnpm test",
          output: "ok",
          failed: false,
        },
      ],
    },
    { prompt: "Thanks", at: null, parts: [] },
  ];

  it("need a session and a same-origin write", async () => {
    signedIn = false;
    const { POST } = await create();
    expect(
      (
        await POST(
          call("/api/admin/blog/sessions", "POST", { title: "T", turns }),
        )
      ).status,
    ).toBe(401);
    signedIn = true;
    expect(
      (
        await POST(
          call(
            "/api/admin/blog/sessions",
            "POST",
            { title: "T", turns },
            { origin: "https://evil.example" },
          ),
        )
      ).status,
    ).toBe(403);
    signedIn = false;
    expect(
      (
        await (
          await one()
        ).GET(call("/x", "GET"), ctx({ id: "4f9c1a00" }) as never)
      ).status,
    ).toBe(401);
  });

  it("stores a redacted session and answers with what the block shows", async () => {
    const { POST } = await create();
    const response = await POST(
      call("/api/admin/blog/sessions", "POST", { title: "Fix it", turns }),
    );
    expect(response.status).toBe(201);
    const { item } = await response.json();
    expect(item).toMatchObject({
      title: "Fix it",
      turnCount: 2,
      toolCallCount: 1,
      startedAt: "2026-10-07T10:00:00.000Z",
    });
    expect(item.id).toMatch(/^[0-9a-f]{8}$/);

    const [row] = await db.select().from(schema.agentSessions);
    expect(row.turns).toEqual(turns);

    const found = await (
      await one()
    ).GET(call("/x", "GET"), ctx({ id: item.id }) as never);
    expect((await found.json()).item).toEqual(item);
    expect(
      (
        await (
          await one()
        ).GET(call("/x", "GET"), ctx({ id: "ffffffff" }) as never)
      ).status,
    ).toBe(404);
    expect(
      (await (await one()).GET(call("/x", "GET"), ctx({ id: "../" }) as never))
        .status,
    ).toBe(404);
  });

  it("refuses what isn't a session", async () => {
    const { POST } = await create();
    for (const body of [
      {},
      { title: "", turns },
      { title: "T", turns: [] },
      { title: "T", turns, extra: 1 },
      { title: "T", turns: [{ prompt: "x", at: "yesterday", parts: [] }] },
      {
        title: "T",
        turns: [{ prompt: "x", at: null, parts: [{ kind: "oops" }] }],
      },
      { title: "x".repeat(121), turns },
    ]) {
      const response = await POST(
        call("/api/admin/blog/sessions", "POST", body),
      );
      expect(response.status).toBe(422);
    }
    expect(await db.select().from(schema.agentSessions)).toHaveLength(0);
  });
});

describe("/api/admin/newsletter", () => {
  const route = async () => await import("@/app/api/admin/newsletter/route");

  it("needs a session and a same-origin write", async () => {
    signedIn = false;
    const { GET, PATCH } = await route();
    expect((await GET(call("/api/admin/newsletter", "GET"))).status).toBe(401);
    signedIn = true;
    expect(
      (
        await PATCH(
          call(
            "/api/admin/newsletter",
            "PATCH",
            { boxTitle: "x" },
            { origin: "https://evil.example" },
          ),
        )
      ).status,
    ).toBe(403);
  });

  it("reads the wording in use, changes it, and makes the blog read fresh data", async () => {
    const { GET, PATCH } = await route();
    const first = await (await GET(call("/x", "GET"))).json();
    expect(first.item.boxTitle).toBe("New posts, in your inbox");
    expect(first.item.enabled).toBe(true);

    const response = await PATCH(
      call("/x", "PATCH", { boxTitle: "Join in", enabled: false }),
    );
    expect(response.status).toBe(200);
    expect((await response.json()).item).toMatchObject({
      boxTitle: "Join in",
      enabled: false,
    });
    expect(revalidate).toHaveBeenCalledWith("blog", { expire: 0 });
    expect((await (await GET(call("/x", "GET"))).json()).item.boxTitle).toBe(
      "Join in",
    );
  });

  it("answers 422 with the fields that are wrong", async () => {
    const { PATCH } = await route();
    const response = await PATCH(call("/x", "PATCH", { boxTitle: "" }));
    expect(response.status).toBe(422);
    expect((await response.json()).fields.boxTitle).toBeTruthy();
    expect(revalidate).not.toHaveBeenCalled();
  });
});

describe("/api/admin/creatives-settings and the creatives lists", () => {
  const settings = async () =>
    await import("@/app/api/admin/creatives-settings/route");

  it("need a session and a same-origin write", async () => {
    signedIn = false;
    const { GET, PATCH } = await settings();
    expect((await GET(call("/x", "GET"))).status).toBe(401);
    signedIn = true;
    expect(
      (
        await PATCH(
          call(
            "/x",
            "PATCH",
            { heroLine: "x" },
            { origin: "https://evil.example" },
          ),
        )
      ).status,
    ).toBe(403);
  });

  it("read and change the wording, and revalidate the creatives pages only", async () => {
    const { GET, PATCH } = await settings();
    const first = await (await GET(call("/x", "GET"))).json();
    expect(first.item.heroStatement).toBe("Design & Photography");
    const response = await PATCH(
      call("/x", "PATCH", { contactNote: "Replies in a day." }),
    );
    expect(response.status).toBe(200);
    expect((await response.json()).item.contactNote).toBe("Replies in a day.");
    expect(revalidate).toHaveBeenCalledWith("creatives", { expire: 0 });
    expect(revalidate).not.toHaveBeenCalledWith("portfolio", expect.anything());
    expect((await PATCH(call("/x", "PATCH", { heroLine: "" }))).status).toBe(
      422,
    );
  });

  it("a write to a creatives list revalidates the creatives tag, not the portfolio's", async () => {
    const response = await (
      await list()
    ).POST(
      call("/api/admin/creative-faqs", "POST", {
        question: "Do you shoot weddings?",
        answer: "Not at the moment.",
        groupName: "photography",
      }),
      ctx({ resource: "creative-faqs" }) as never,
    );
    expect(response.status).toBe(201);
    expect(revalidate).toHaveBeenCalledWith("creatives", { expire: 0 });
    expect(revalidate).not.toHaveBeenCalledWith("portfolio", expect.anything());
    revalidate.mockClear();
    await (
      await list()
    ).POST(
      call("/api/admin/faqs", "POST", { question: "Q?", answer: "A." }),
      ctx({ resource: "faqs" }) as never,
    );
    expect(revalidate).toHaveBeenCalledWith("portfolio", { expire: 0 });
  });
});
