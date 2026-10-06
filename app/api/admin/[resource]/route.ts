import { createRow, listRows } from "@/lib/admin/api";
import {
  failure,
  guard,
  json,
  published,
  readBody,
  unknownResource,
} from "@/lib/admin/route";
import { getDb } from "@/lib/db";

// GET /api/admin/<resource>: every entry, drafts included, in display order.
export async function GET(
  request: Request,
  { params }: RouteContext<"/api/admin/[resource]">,
) {
  const denied = await guard(request, { body: false });
  if (denied) return denied;
  const { resource } = await params;
  const missing = unknownResource(resource);
  if (missing) return missing;
  return json({ items: await listRows(getDb(), resource) });
}

// POST /api/admin/<resource>: a new entry at the end, unpublished unless the body
// says otherwise.
export async function POST(
  request: Request,
  { params }: RouteContext<"/api/admin/[resource]">,
) {
  const denied = await guard(request, { body: true });
  if (denied) return denied;
  const { resource } = await params;
  const missing = unknownResource(resource);
  if (missing) return missing;

  const result = await createRow(getDb(), resource, await readBody(request));
  if (!result.ok) return failure(result);
  published();
  return json({ item: result.row }, 201);
}
