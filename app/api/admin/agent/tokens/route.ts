import { guard, json, readBody } from "@/lib/admin/route";
import { getDb } from "@/lib/db";
import { createToken, listTokens } from "@/lib/mcp/tokens";

// GET /api/admin/agent/tokens: the agent tokens (never their secret or hash).
export async function GET(request: Request) {
  const denied = await guard(request, { body: false });
  if (denied) return denied;
  return json({ items: await listTokens(getDb()) });
}

// POST /api/admin/agent/tokens: a new token. The secret is in this answer only; it cannot
// be shown again (docs/mcp.md §3).
export async function POST(request: Request) {
  const denied = await guard(request, { body: true });
  if (denied) return denied;
  const result = await createToken(getDb(), await readBody(request));
  if (!result.ok) return json({ error: "invalid", fields: result.fields }, 422);
  return json({ token: result.token, item: result.view }, 201);
}
