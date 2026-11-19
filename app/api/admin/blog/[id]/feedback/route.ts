import { listFeedback, markFeedbackRead } from "@/lib/blog/draftFeedback";
import { guard, json, parseId, readBody } from "@/lib/admin/route";
import { getDb } from "@/lib/db";

// /api/admin/blog/<id>/feedback: a draft's private feedback (D93, design.md §13.71).
// GET lists it, newest first; PATCH marks items read: `{ "ids": [1, 2] }` or
// `{ "all": true }`.

export async function GET(
  request: Request,
  { params }: RouteContext<"/api/admin/blog/[id]/feedback">,
) {
  const denied = await guard(request, { body: false });
  if (denied) return denied;
  const id = parseId((await params).id);
  if (id === null) return json({ error: "not-found" }, 404);
  return json({ items: await listFeedback(getDb(), id) });
}

export async function PATCH(
  request: Request,
  { params }: RouteContext<"/api/admin/blog/[id]/feedback">,
) {
  const denied = await guard(request, { body: true });
  if (denied) return denied;
  const id = parseId((await params).id);
  if (id === null) return json({ error: "not-found" }, 404);
  const body = (await readBody(request)) as {
    ids?: unknown;
    all?: unknown;
  } | null;
  const ids =
    body?.all === true
      ? "all"
      : Array.isArray(body?.ids) &&
          body.ids.every((value) => Number.isInteger(value) && value > 0)
        ? (body.ids as number[])
        : null;
  if (ids === null)
    return json(
      { error: "invalid", fields: { _: "Send `ids` or `all: true`." } },
      422,
    );
  const marked = await markFeedbackRead(getDb(), id, ids);
  return json({ marked });
}
