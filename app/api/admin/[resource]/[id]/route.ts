import { deleteRow, updateRow } from "@/lib/admin/api";
import {
  failure,
  guard,
  json,
  parseId,
  published,
  readBody,
  unknownResource,
} from "@/lib/admin/route";
import { getDb } from "@/lib/db";

// PATCH /api/admin/<resource>/<id>: changes the fields in the body, nothing else.
export async function PATCH(
  request: Request,
  { params }: RouteContext<"/api/admin/[resource]/[id]">,
) {
  const denied = await guard(request, { body: true });
  if (denied) return denied;
  const { resource, id: rawId } = await params;
  const missing = unknownResource(resource);
  const id = parseId(rawId);
  if (missing || id === null)
    return missing ?? json({ error: "not-found" }, 404);

  const result = await updateRow(
    getDb(),
    resource,
    id,
    await readBody(request),
  );
  if (!result.ok) return failure(result);
  published();
  return json({ item: result.row });
}

// DELETE /api/admin/<resource>/<id>
export async function DELETE(
  request: Request,
  { params }: RouteContext<"/api/admin/[resource]/[id]">,
) {
  const denied = await guard(request, { body: false });
  if (denied) return denied;
  const { resource, id: rawId } = await params;
  const missing = unknownResource(resource);
  const id = parseId(rawId);
  if (missing || id === null)
    return missing ?? json({ error: "not-found" }, 404);

  const result = await deleteRow(getDb(), resource, id);
  if (!result.ok) return failure(result);
  published();
  return json({ ok: true });
}
