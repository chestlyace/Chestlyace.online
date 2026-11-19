import { deleteFeedback } from "@/lib/blog/draftFeedback";
import { guard, json, parseId } from "@/lib/admin/route";
import { getDb } from "@/lib/db";

// DELETE /api/admin/blog/<id>/feedback/<feedbackId>: removes one item of a draft's
// feedback (design.md §13.71; the editor asks first).
export async function DELETE(
  request: Request,
  { params }: RouteContext<"/api/admin/blog/[id]/feedback/[feedbackId]">,
) {
  const denied = await guard(request, { body: false });
  if (denied) return denied;
  const { id: rawId, feedbackId: rawFeedbackId } = await params;
  const id = parseId(rawId);
  const feedbackId = parseId(rawFeedbackId);
  if (id === null || feedbackId === null)
    return json({ error: "not-found" }, 404);
  return (await deleteFeedback(getDb(), id, feedbackId))
    ? json({ ok: true })
    : json({ error: "not-found" }, 404);
}
