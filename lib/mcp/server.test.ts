import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { z } from "zod";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import * as schema from "@/db/schema";
import type { Database } from "@/lib/db";
import { listActivity } from "./activity";
import { resetLimits } from "./limits";
import { createMcpServer } from "./server";
import { allTools } from "./tools";
import { ToolError, defineTool, type AnyTool, type Caller } from "./tool";

let db: Database;
beforeAll(async () => {
  const instance = drizzle(new PGlite(), { schema });
  await migrate(instance, { migrationsFolder: "db/migrations" });
  db = instance;
}, 30_000);

beforeEach(async () => {
  await db.delete(schema.agentActivity);
  await db.delete(schema.agentTokens);
  resetLimits(1);
});

async function connect(
  scopes: string[],
  tools: readonly AnyTool[] = allTools(),
) {
  const [row] = await db
    .insert(schema.agentTokens)
    .values({
      name: "Test agent",
      tokenHash: `h${Math.random()}`,
      prefix: "cmcp_xx",
      scopes,
    })
    .returning();
  const caller: Caller = { id: row.id, name: "Test agent", scopes };
  resetLimits(row.id);
  const server = createMcpServer(db, caller, tools);
  const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
  await server.connect(serverSide);
  const client = new Client({ name: "test", version: "1" });
  await client.connect(clientSide);
  return { client, caller };
}

const textOf = (result: object) =>
  (result as { content: { type: string; text: string }[] }).content[0].text;

describe("the server's tool list follows the token's scopes", () => {
  it("lists only the read tools to a read-only token", async () => {
    const { client } = await connect(["read"]);
    const names = (await client.listTools()).tools
      .map((tool) => tool.name)
      .sort();
    expect(names).toEqual(["get_guide", "list_resources", "whoami"]);
  });

  it("adds the media tools with the media scope", async () => {
    const { client } = await connect(["read", "media"]);
    const names = (await client.listTools()).tools.map((tool) => tool.name);
    expect(names).toEqual(
      expect.arrayContaining([
        "media_upload_from_url",
        "media_upload_base64",
        "resume_upload",
      ]),
    );
  });

  it("describes each tool with a title, a schema and annotations", async () => {
    const { client } = await connect(["read", "media"]);
    const tools = (await client.listTools()).tools;
    const upload = tools.find((tool) => tool.name === "media_upload_from_url")!;
    expect(upload.annotations?.readOnlyHint).toBe(false);
    expect(upload.inputSchema.properties).toHaveProperty("url");
    expect(upload.description).toMatch(/https/);
    expect(
      tools.find((tool) => tool.name === "whoami")!.annotations?.readOnlyHint,
    ).toBe(true);
  });
});

describe("general tools", () => {
  it("whoami says who the token is and where the sites are", async () => {
    const { client } = await connect(["read", "write"]);
    const result = await client.callTool({ name: "whoami", arguments: {} });
    const data = JSON.parse(textOf(result));
    expect(data.token).toBe("Test agent");
    expect(data.scopes).toEqual(["read", "write"]);
    expect(data.sites.admin).toMatch(/^https?:\/\//);
  });

  it("list_resources describes every resource from the admin's own schemas", async () => {
    const { client } = await connect(["read"]);
    const data = JSON.parse(
      textOf(await client.callTool({ name: "list_resources", arguments: {} })),
    );
    const names = data.resources.map((r: { name: string }) => r.name);
    expect(names).toEqual(
      expect.arrayContaining([
        "projects",
        "skills",
        "journey",
        "faqs",
        "design_pieces",
        "photo_events",
        "creative_services",
        "creatives_settings",
        "profile",
        "newsletter",
      ]),
    );
    const projects = data.resources.find(
      (r: { name: string }) => r.name === "projects",
    );
    expect(projects.hasPublishedSwitch).toBe(true);
    expect(projects.translatableFields).toEqual(
      expect.arrayContaining(["title", "summary"]),
    );
    expect(projects.fields.properties).toHaveProperty("title");
    expect(
      data.resources.find((r: { name: string }) => r.name === "profile").kind,
    ).toBe("single");
  });

  it("get_guide returns each guide, and refuses a name it does not have", async () => {
    const { client } = await connect(["read"]);
    for (const name of ["blog_markdown", "languages", "images"]) {
      const result = await client.callTool({
        name: "get_guide",
        arguments: { name },
      });
      expect(result.isError).toBeFalsy();
      expect(textOf(result).length).toBeGreaterThan(200);
    }
    expect(
      textOf(
        await client.callTool({
          name: "get_guide",
          arguments: { name: "images" },
        }),
      ),
    ).toContain("portfolio/projects");
    expect(
      textOf(
        await client.callTool({
          name: "get_guide",
          arguments: { name: "blog_markdown" },
        }),
      ),
    ).toMatch(/quiz|callout/i);
    const bad = await client.callTool({
      name: "get_guide",
      arguments: { name: "nope" },
    });
    expect(bad.isError).toBe(true);
  });

  it("serves the guides as resources, and two prompts", async () => {
    const { client } = await connect(["read"]);
    const uris = (await client.listResources()).resources
      .map((r) => r.uri)
      .sort();
    expect(uris).toEqual([
      "guide://blog-markdown",
      "guide://images",
      "guide://languages",
    ]);
    const read = await client.readResource({ uri: "guide://languages" });
    expect((read.contents[0] as { text: string }).text).toContain(
      "translations.fr",
    );
    const prompts = (await client.listPrompts()).prompts
      .map((p) => p.name)
      .sort();
    expect(prompts).toEqual(["add_project", "write_blog_post"]);
    const prompt = await client.getPrompt({
      name: "write_blog_post",
      arguments: { topic: "Caching" },
    });
    expect((prompt.messages[0].content as { text: string }).text).toContain(
      "Caching",
    );
  });
});

describe("every call is logged", () => {
  it("records a successful call with its summary, and an error with its message", async () => {
    const boom = defineTool({
      name: "boom",
      title: "Boom",
      description: "Always refuses",
      scope: "read",
      write: false,
      input: { x: z.string() },
      async run() {
        throw new ToolError("Nope: send y instead.", { y: "Required." });
      },
    });
    const crash = defineTool({
      name: "crash",
      title: "Crash",
      description: "Throws a real error",
      scope: "read",
      write: false,
      input: {},
      async run() {
        throw new Error("secret database detail");
      },
    });
    const { client } = await connect(["read"], [...allTools(), boom, crash]);
    await client.callTool({ name: "whoami", arguments: {} });
    const refused = await client.callTool({
      name: "boom",
      arguments: { x: "1" },
    });
    expect(refused.isError).toBe(true);
    expect(textOf(refused)).toContain("Nope: send y instead.");
    expect(textOf(refused)).toContain('"y": "Required."');
    const crashed = await client.callTool({ name: "crash", arguments: {} });
    expect(crashed.isError).toBe(true);
    expect(textOf(crashed)).not.toContain("secret database detail");

    const log = await listActivity(db);
    expect(log.map((row) => [row.tool, row.ok])).toEqual([
      ["crash", false],
      ["boom", false],
      ["whoami", true],
    ]);
    expect(log[2].summary).toBe("Checked the token");
    expect(log[1].error).toContain("Nope");
    expect(log[0].error).not.toContain("secret");
    expect(log.every((row) => row.tokenName === "Test agent")).toBe(true);
  });

  it("limits writes to 30 a minute per token and says when to retry", async () => {
    const write = defineTool({
      name: "touch",
      title: "Touch",
      description: "A write",
      scope: "read",
      write: true,
      input: {},
      async run() {
        return { summary: "Touched", data: "ok" };
      },
    });
    const { client } = await connect(["read"], [write]);
    for (let i = 0; i < 30; i++)
      expect(
        (await client.callTool({ name: "touch", arguments: {} })).isError,
      ).toBeFalsy();
    const refused = await client.callTool({ name: "touch", arguments: {} });
    expect(refused.isError).toBe(true);
    expect(textOf(refused)).toMatch(/Too many writes\. Wait \d+ seconds/);
  });

  it("cuts an answer over 200 KB and says so", async () => {
    const big = defineTool({
      name: "big",
      title: "Big",
      description: "Returns a lot",
      scope: "read",
      write: false,
      input: {},
      async run() {
        return { summary: "Big", data: "x".repeat(250_000) };
      },
    });
    const { client } = await connect(["read"], [big]);
    const text = textOf(await client.callTool({ name: "big", arguments: {} }));
    expect(text.length).toBeLessThan(201_000);
    expect(text).toContain("over 200 KB");
  });
});
