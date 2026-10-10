import { guard, json, parseId } from "@/lib/admin/route";
import { getDb } from "@/lib/db";
import { listActivity } from "@/lib/mcp/activity";

// GET /api/admin/agent/activity?token=<id>: the latest agent calls (200 at most).
export async function GET(request: Request) {
  const denied = await guard(request, { body: false });
  if (denied) return denied;
  const token = new URL(request.url).searchParams.get("token");
  const tokenId = token ? parseId(token) : null;
  return json({
    items: await listActivity(getDb(), tokenId ? { tokenId } : {}),
  });
}
