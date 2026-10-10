import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { beforeAll, describe, expect, it, vi } from "vitest";
import * as schema from "@/db/schema";
import type { Database } from "@/lib/db";
import { listActivity } from "./activity";
import { handleMcpRequest } from "./http";
import { createToken } from "./tokens";
import { testDb } from "./testkit";

vi.mock("next/cache", () => ({
  revalidateTag: () => {},
  unstable_cache: (fn: unknown) => fn,
}));

let db: Database;
beforeAll(async () => {
  db = await testDb();
}, 30_000);

// A real MCP client talking to the real route handler (through fetch), from a token made
// the way the admin makes it to a published post, with every call in the Activity log.
describe("an agent from token to a live post", () => {
  it("writes, checks and publishes a post, and the owner sees what it did", async () => {
    const created = await createToken(db, {
      name: "Claude Code",
      scopes: ["write", "publish"],
      expires: "90",
    });
    if (!created.ok) throw new Error("token");
    const secret = created.token;

    const transport = new StreamableHTTPClientTransport(
      new URL("https://admin.example/mcp"),
      {
        requestInit: { headers: { Authorization: `Bearer ${secret}` } },
        fetch: (input, init) => handleMcpRequest(new Request(input, init), db),
      },
    );
    const client = new Client({ name: "e2e", version: "1" });
    await client.connect(transport);

    const call = async (name: string, args: Record<string, unknown> = {}) => {
      const result = (await client.callTool({ name, arguments: args })) as {
        isError?: boolean;
        content: { text: string }[];
      };
      return { error: result.isError === true, text: result.content[0].text };
    };

    const me = await call("whoami");
    expect(JSON.parse(me.text).scopes).toEqual(["read", "write", "publish"]);
    expect(
      JSON.parse((await call("list_resources")).text).resources.length,
    ).toBeGreaterThan(10);
    expect((await call("get_guide", { name: "blog_markdown" })).text).toMatch(
      /callout|##/i,
    );

    const post = await call("blog_create", {
      title: "Hello from an agent",
      slug: "hello-agent",
      description: "Written over MCP",
      content: "## Hi\n\nThis was written by an agent.",
      tags: ["mcp"],
    });
    const id = JSON.parse(post.text).id as number;
    expect((await call("blog_validate", { content: "## Hi" })).error).toBe(
      false,
    );
    const live = await call("blog_publish", { id });
    expect(JSON.parse(live.text).status).toBe("published");
    // a delete is not even listed to this token
    const names = (await client.listTools()).tools.map((t) => t.name);
    expect(names).not.toContain("blog_delete");
    const refused = await client
      .callTool({
        name: "blog_delete",
        arguments: { id, confirm: "hello-agent" },
      })
      .then(
        (r) => (r as { isError?: boolean }).isError === true,
        () => true,
      );
    expect(refused).toBe(true);
    await client.close();

    const rows = await db.select().from(schema.blogPosts);
    expect(rows).toHaveLength(1);
    const activity = await listActivity(db);
    const tools = activity.map((a: { tool: string }) => a.tool);
    expect(tools).toEqual(
      expect.arrayContaining(["whoami", "blog_create", "blog_publish"]),
    );
    expect(tools).not.toContain("blog_delete");
  });
});
