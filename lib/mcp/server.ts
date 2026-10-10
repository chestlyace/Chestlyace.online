import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import type { Database } from "@/lib/db";
import { logActivity } from "./activity";
import { GUIDE_NAMES, GUIDE_TITLES, guide } from "./guides";
import { checkWrite } from "./limits";
import { hasScope } from "./scopes";
import { ToolError, type AnyTool, type Caller } from "./tool";

// One MCP server per request (stateless, docs/mcp.md §2): it lists only the tools the
// token's scopes allow, and wraps each call to rate-limit it, run it, log it and turn a
// failure into a message the agent can act on.

const MAX_TEXT = 200_000; // docs/mcp.md §2: a response is capped at 200 KB of text

function text(value: unknown): string {
  const body =
    typeof value === "string" ? value : JSON.stringify(value, null, 2);
  return body.length > MAX_TEXT
    ? `${body.slice(0, MAX_TEXT)}\n… (cut: the answer is over 200 KB; ask for a smaller page)`
    : body;
}

export function allowed(tool: AnyTool, scopes: readonly string[]): boolean {
  return (
    hasScope(scopes, tool.scope) &&
    (tool.alsoNeeds ?? []).every((needed) => hasScope(scopes, needed))
  );
}

function failure(message: string): CallToolResult {
  return { isError: true, content: [{ type: "text", text: message }] };
}

export function createMcpServer(
  db: Database,
  caller: Caller,
  tools: readonly AnyTool[],
): McpServer {
  const server = new McpServer(
    { name: "chestlyace-admin", version: "1.0.0" },
    {
      instructions:
        "Tools to run Chestly Ace's websites (portfolio, blog, creatives). Start with whoami and list_resources; read get_guide before writing a blog post or uploading pictures. New content is created unpublished unless you have the publish scope. Deleting needs the item's exact name in `confirm`.",
    },
  );

  for (const tool of tools) {
    if (!allowed(tool, caller.scopes)) continue;
    server.registerTool(
      tool.name,
      {
        title: tool.title,
        description: tool.description,
        inputSchema: tool.input,
        annotations: {
          readOnlyHint: tool.hints?.readOnly ?? !tool.write,
          destructiveHint: tool.hints?.destructive ?? false,
          idempotentHint: tool.hints?.idempotent ?? false,
          openWorldHint: false,
        },
      },
      async (args: unknown): Promise<CallToolResult> => {
        const base = {
          tokenId: caller.id,
          tokenName: caller.name,
          tool: tool.name,
        };
        if (tool.write) {
          const limit = checkWrite(caller.id);
          if (!limit.allowed) {
            const error = `Too many writes. Wait ${limit.retryAfterSeconds} seconds and try again.`;
            await logActivity(db, { ...base, ok: false, error }).catch(
              () => {},
            );
            return failure(error);
          }
        }
        try {
          const result = await tool.run(args as never, { db, caller });
          await logActivity(db, {
            ...base,
            ok: true,
            summary: result.summary,
          }).catch(() => {});
          return { content: [{ type: "text", text: text(result.data) }] };
        } catch (error) {
          const message =
            error instanceof ToolError
              ? error.fields
                ? `${error.message}\n${JSON.stringify(error.fields, null, 2)}`
                : error.message
              : "Something went wrong on the server. Try again; if it keeps failing, tell the owner.";
          if (!(error instanceof ToolError)) console.error(error);
          await logActivity(db, { ...base, ok: false, error: message }).catch(
            () => {},
          );
          return failure(message);
        }
      },
    );
  }

  // The guides, also as resources (a client that supports them can attach one).
  for (const name of GUIDE_NAMES) {
    server.registerResource(
      `guide-${name}`,
      `guide://${name.replace(/_/g, "-")}`,
      { title: GUIDE_TITLES[name], mimeType: "text/markdown" },
      async (uri) => ({
        contents: [
          { uri: uri.href, mimeType: "text/markdown", text: guide(name) },
        ],
      }),
    );
  }

  server.registerPrompt(
    "write_blog_post",
    {
      title: "Write a blog post",
      description: "The order of work for a blog post with a cover picture.",
      argsSchema: { topic: z.string().describe("What the post is about") },
    },
    ({ topic }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Write a blog post about: ${topic}\n\n1. Read get_guide("blog_markdown") and get_guide("images").\n2. Upload a cover with media_upload_from_url or media_upload_base64 (use "blog").\n3. Create the post as a draft with blog_create (title, slug, description, tags, coverUrl and coverAlt, content in the block markdown). Add the French version in translations.fr if asked.\n4. Check it with blog_validate and fix every problem.\n5. Tell the owner it is ready; only publish (blog_publish) if your token may and the owner asked.`,
          },
        },
      ],
    }),
  );

  server.registerPrompt(
    "add_project",
    {
      title: "Add a project",
      description: "The order of work for a portfolio project with pictures.",
      argsSchema: { name: z.string().describe("The project's name") },
    },
    ({ name }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Add the project "${name}" to the portfolio.\n\n1. Call list_resources and read the projects fields.\n2. Upload its pictures with media_upload_from_url (use "project").\n3. Create it with projects_create (unpublished unless you may publish and the owner asked).\n4. Add the French text in translations.fr.\n5. Tell the owner what you created.`,
          },
        },
      ],
    }),
  );

  return server;
}
