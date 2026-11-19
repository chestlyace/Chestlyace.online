import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { getPublishedPost } from "@/lib/blog/data";
import type { Database } from "@/lib/db";
import { listActivity } from "./activity";
import { handleMcpRequest } from "./http";
import { resetLimits } from "./limits";
import { testDb } from "./testkit";
import { createToken, revokeToken } from "./tokens";

// End to end (docs/mcp.md §8, Phase 13b.6): the SDK's real HTTP client talks to the
// /mcp route handler with a token made the way the admin makes one. Cloudinary is stood
// in for; the cache refreshes are recorded instead of run.

const revalidated = vi.hoisted(() => [] as string[]);
vi.mock("next/cache", () => ({
  revalidateTag: (tag: string) => revalidated.push(tag),
  unstable_cache: (fn: unknown) => fn,
}));
vi.mock("./media", async (original) => ({
  ...(await original<typeof import("./media")>()),
  fetchPublicFile: async () => ({
    bytes: new Uint8Array([0x89, 0x50, 0x4e, 0x47]),
    filename: "cover.png",
  }),
  uploadFile: async () => ({
    url: "https://res.cloudinary.com/x/image/upload/f_auto,q_auto/portfolio/blog/cover.png",
    width: 1600,
    height: 900,
    bytes: 1234,
    format: "png",
  }),
}));

let db: Database;
beforeAll(async () => {
  db = await testDb();
}, 30_000);

async function connect(token: string) {
  const transport = new StreamableHTTPClientTransport(
    new URL("https://admin.example/mcp"),
    {
      requestInit: { headers: { Authorization: `Bearer ${token}` } },
      // The route handler itself, in place of the network.
      fetch: (url, init) =>
        handleMcpRequest(new Request(url, init as RequestInit), db),
    },
  );
  const client = new Client({ name: "e2e", version: "1" });
  await client.connect(transport);
  const call = async (name: string, args: Record<string, unknown> = {}) => {
    const result = (await client.callTool({ name, arguments: args })) as {
      isError?: boolean;
      content: { text: string }[];
    };
    const text = result.content[0].text;
    if (result.isError) throw new Error(`${name}: ${text}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- the test reads the JSON freely
    return JSON.parse(text) as any;
  };
  return { client, call };
}

describe("an agent over HTTP, from token to live content", () => {
  it("writes and publishes a post with a picture, adds a project and a piece, is logged, and stops when revoked", async () => {
    const created = await createToken(db, {
      name: "Claude",
      scopes: ["write", "publish", "media"],
      expires: "90",
    });
    if (!created.ok) throw new Error("token");
    resetLimits(created.view.id);
    const { client, call } = await connect(created.token);

    const me = await call("whoami");
    expect(me).toMatchObject({ token: "Claude" });
    const names = (await client.listTools()).tools.map((tool) => tool.name);
    expect(names).toEqual(
      expect.arrayContaining([
        "blog_create",
        "projects_create",
        "design_pieces_create",
        "media_upload_from_url",
      ]),
    );
    expect(names).not.toContain("blog_delete"); // no delete scope

    const cover = await call("media_upload_from_url", {
      use: "blog",
      url: "https://example.com/cover.png",
    });
    const post = await call("blog_create", {
      title: "Hello from an agent",
      slug: "hello-from-an-agent",
      description: "Written over MCP.",
      content: "## Why\n\nBecause it can.",
      coverUrl: cover.url,
      coverAlt: "A cover",
    });
    expect(post.status).toBe("draft");
    expect(await getPublishedPost(db, "hello-from-an-agent")).toBeNull();
    await call("blog_publish", { id: post.id });
    const live = await getPublishedPost(db, "hello-from-an-agent");
    expect(live?.post).toMatchObject({
      title: "Hello from an agent",
      coverUrl: cover.url,
    });

    const project = await call("projects_create", {
      data: {
        title: "Clasync",
        slug: "clasync",
        summary: "Classes in one place",
        description: "A class-management app.",
      },
    });
    expect(project.isPublished).toBe(false);
    await call("projects_set_published", { id: project.id, published: true });

    await call("design_pieces_create", {
      data: {
        title: "Acme identity",
        slug: "acme",
        category: "Brand identity",
        coverUrl: cover.url,
        coverWidth: 1600,
        coverHeight: 900,
        coverAlt: "The logo",
      },
    });

    // The sites were told to read fresh data, as the admin does.
    expect(revalidated).toEqual(
      expect.arrayContaining(["blog", "portfolio", "creatives"]),
    );

    // Every call is in the Activity screen.
    const activity = await listActivity(db, { tokenId: created.view.id });
    expect(activity.map((row) => row.tool)).toEqual(
      expect.arrayContaining([
        "whoami",
        "media_upload_from_url",
        "blog_create",
        "blog_publish",
        "projects_create",
        "projects_set_published",
        "design_pieces_create",
      ]),
    );
    expect(activity.every((row) => row.ok)).toBe(true);

    // A revoked token stops working at once.
    await revokeToken(db, created.view.id);
    await expect(call("whoami")).rejects.toThrow();
    await client.close();
  }, 60_000);
});
