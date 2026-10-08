import { guardWrite, parseId, reply } from "@/lib/blog/commentRoute";
import { reportComment } from "@/lib/blog/comments";
import { getDb } from "@/lib/db";

// POST /api/blog/comments/<id>/report: tell the owner about a comment (one report
// per reader).
export async function POST(
  request: Request,
  { params }: RouteContext<"/api/blog/comments/[id]/report">,
) {
  const guard = await guardWrite(request, "action");
  if ("response" in guard) return guard.response;
  const id = parseId((await params).id);
  if (id === null) return reply({ error: "not-found" }, 404);
  const result = await reportComment(getDb(), id, guard.reader.id);
  return result.ok
    ? reply({ ok: true })
    : reply(
        {
          error: result.error,
          ...("message" in result ? { message: result.message } : {}),
        },
        result.status,
      );
}
