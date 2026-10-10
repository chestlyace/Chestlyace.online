import { getDb } from "@/lib/db";
import { handleMcpRequest } from "@/lib/mcp/http";

// POST https://admin.chestlyace.online/mcp (docs/mcp.md §2): the MCP endpoint, on the admin
// host. Not behind the admin's session cookie: an agent proves itself with a token.
export const maxDuration = 60;

const handle = (request: Request) => handleMcpRequest(request, getDb());

export const POST = handle;
export const GET = handle;
export const DELETE = handle;
