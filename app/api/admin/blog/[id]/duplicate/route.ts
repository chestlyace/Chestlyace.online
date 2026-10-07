import { duplicatePost } from "@/lib/admin/blogApi";
import { failure, guard, json, parseId } from "@/lib/admin/route";
import { getDb } from "@/lib/db";

// POST /api/admin/blog/<id>/duplicate: a draft copy ("Copy of …"). A draft isn't
// public, so nothing needs revalidating.
export async function POST(
  request: Request,
  { params }: RouteContext<"/api/admin/blog/[id]/duplicate">,
) {
  const denied = await guard(request, { body: false });
  if (denied) return denied;
  const id = parseId((await params).id);
  if (id === null) return json({ error: "not-found" }, 404);
  const result = await duplicatePost(getDb(), id);
  if (!result.ok) return failure(result);
  return json({ item: result.post }, 201);
}
