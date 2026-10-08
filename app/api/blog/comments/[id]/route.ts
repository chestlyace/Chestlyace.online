import { guardWrite, parseId, reply } from "@/lib/blog/commentRoute";
import { deleteOwnComment } from "@/lib/blog/comments";
import { getDb } from "@/lib/db";

// DELETE /api/blog/comments/<id>: a reader deletes their own comment.
export async function DELETE(
  request: Request,
  { params }: RouteContext<"/api/blog/comments/[id]">,
) {
  const guard = await guardWrite(request, "action");
  if ("response" in guard) return guard.response;
  const id = parseId((await params).id);
  if (id === null) return reply({ error: "not-found" }, 404);
  const result = await deleteOwnComment(getDb(), id, guard.reader.id);
  return result.ok
    ? reply({ ok: true })
    : reply({ error: result.error }, result.status);
}
