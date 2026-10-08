import { guardWrite, parseId, reply } from "@/lib/blog/commentRoute";
import { toggleCommentLike } from "@/lib/blog/comments";
import { getDb } from "@/lib/db";

// POST /api/blog/comments/<id>/like: like, or take the like back (needs an account).
export async function POST(
  request: Request,
  { params }: RouteContext<"/api/blog/comments/[id]/like">,
) {
  const guard = await guardWrite(request, "action");
  if ("response" in guard) return guard.response;
  const id = parseId((await params).id);
  if (id === null) return reply({ error: "not-found" }, 404);
  const result = await toggleCommentLike(getDb(), id, guard.reader.id);
  return result.ok
    ? reply({ count: result.count, liked: result.liked })
    : reply({ error: result.error }, result.status);
}
