import { getSessionInfo } from "@/lib/admin/sessionsApi";
import { guard, json } from "@/lib/admin/route";
import { getDb } from "@/lib/db";

// GET /api/admin/blog/sessions/<id>: what a session block shows about its session.
export async function GET(
  request: Request,
  { params }: RouteContext<"/api/admin/blog/sessions/[id]">,
) {
  const denied = await guard(request, { body: false });
  if (denied) return denied;
  const { id } = await params;
  const item = /^[0-9a-f]{6,16}$/.test(id)
    ? await getSessionInfo(getDb(), id)
    : null;
  return item ? json({ item }) : json({ error: "not-found" }, 404);
}
