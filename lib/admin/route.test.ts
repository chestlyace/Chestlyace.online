import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
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
