import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import type { Database } from "@/lib/db";
import { checkRequest } from "./limits";
import { createMcpServer } from "./server";
import { allTools } from "./tools";
import { bearerOf, verifyToken } from "./tokens";
import type { AnyTool } from "./tool";

// The `/mcp` endpoint (docs/mcp.md §2, §3): a stateless Streamable HTTP server. Each request
// carries its token; it is checked, rate-limited, answered by a server built for that token's
// scopes, and forgotten. JSON answers (no event stream): the server never pushes.

export const MAX_BODY_BYTES = 12 * 1024 * 1024;

const reply = (
  status: number,
  body: Record<string, unknown>,
  headers: HeadersInit = {},
) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...headers,
    },
  });

export async function handleMcpRequest(
  request: Request,
  db: Database,
  tools: readonly AnyTool[] = allTools(),
): Promise<Response> {
  if (request.method !== "POST")
    return reply(
      405,
      { error: "method-not-allowed", message: "Send MCP requests with POST." },
      { Allow: "POST" },
    );

  const verified = await verifyToken(
    db,
    bearerOf(request.headers.get("authorization")),
  );
  if (!verified.ok)
    return reply(
      401,
      {
        error: "unauthorized",
        message:
          verified.reason === "missing"
            ? "Send the token as `Authorization: Bearer cmcp_…`."
            : verified.reason === "invalid"
              ? "That token is not recognised."
              : `That token is ${verified.reason}. Ask the owner for a new one.`,
      },
      { "WWW-Authenticate": 'Bearer realm="chestlyace-mcp"' },
    );

  const limit = checkRequest(verified.token.id);
  if (!limit.allowed)
    return reply(
      429,
      {
        error: "rate-limited",
        message: `Too many requests. Wait ${limit.retryAfterSeconds} seconds.`,
      },
      { "Retry-After": String(limit.retryAfterSeconds) },
    );

  const declared = Number(request.headers.get("content-length"));
  if (declared > MAX_BODY_BYTES)
    return reply(413, {
      error: "too-large",
      message: "The request is over 12 MB.",
    });

  const server = createMcpServer(db, verified.token, tools);
  const transport = new WebStandardStreamableHTTPServerTransport({
    enableJsonResponse: true,
  });
  await server.connect(transport);
  try {
    return await transport.handleRequest(request);
  } finally {
    await transport.close();
    await server.close();
  }
}
