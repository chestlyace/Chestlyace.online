import { guard, json, parseId } from "@/lib/admin/route";
import { getDb } from "@/lib/db";
import { revokeToken } from "@/lib/mcp/tokens";

// DELETE /api/admin/agent/tokens/:id: revokes the token; it stops working at once. The
// row stays, so the Activity screen can still name it.
export async function DELETE(
  request: Request,
  { params }: RouteContext<"/api/admin/agent/tokens/[id]">,
) {
  const denied = await guard(request, { body: false });
  if (denied) return denied;
  const id = parseId((await params).id);
  if (id === null || !(await revokeToken(getDb(), id)))
    return json({ error: "not-found" }, 404);
  return json({ ok: true });
}
