import { getShare, sharePost, unsharePost } from "@/lib/admin/shareApi";
import { failure, guard, json, parseId, readBody } from "@/lib/admin/route";
import { getDb } from "@/lib/db";

// /api/admin/blog/<id>/share: a draft's share link (D93, design.md §13.70).
// GET reads it, POST turns sharing on (`{ "renew": true }` makes a new link), DELETE
// turns it off. The public pages are not cached by it, so nothing is revalidated.

export async function GET(
  request: Request,
  { params }: RouteContext<"/api/admin/blog/[id]/share">,
) {
  const denied = await guard(request, { body: false });
  if (denied) return denied;
  const id = parseId((await params).id);
  if (id === null) return json({ error: "not-found" }, 404);
  const result = await getShare(getDb(), id);
  return result.ok ? json({ share: result.share }) : failure(result);
}

export async function POST(
  request: Request,
  { params }: RouteContext<"/api/admin/blog/[id]/share">,
) {
  const denied = await guard(request, { body: false });
  if (denied) return denied;
  const id = parseId((await params).id);
  if (id === null) return json({ error: "not-found" }, 404);
  const body = await readBody(request);
  const renew =
    typeof body === "object" &&
    body !== null &&
    (body as { renew?: unknown }).renew === true;
  const result = await sharePost(getDb(), id, { renew });
  return result.ok ? json({ share: result.share }) : failure(result);
}

export async function DELETE(
  request: Request,
  { params }: RouteContext<"/api/admin/blog/[id]/share">,
) {
  const denied = await guard(request, { body: false });
  if (denied) return denied;
  const id = parseId((await params).id);
  if (id === null) return json({ error: "not-found" }, 404);
  const result = await unsharePost(getDb(), id);
  return result.ok ? json({ share: null }) : failure(result);
}
