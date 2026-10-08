import { reorderRows } from "@/lib/admin/api";
import {
  failure,
  guard,
  json,
  published,
  readBody,
  unknownResource,
} from "@/lib/admin/route";
import { getDb } from "@/lib/db";

// POST /api/admin/<resource>/reorder { ids }: the new order of those entries.
export async function POST(
  request: Request,
  { params }: RouteContext<"/api/admin/[resource]/reorder">,
) {
  const denied = await guard(request, { body: true });
  if (denied) return denied;
  const { resource } = await params;
  const missing = unknownResource(resource);
  if (missing) return missing;

  const result = await reorderRows(getDb(), resource, await readBody(request));
  if (!result.ok) return failure(result);
  published(resource);
  return json({ ok: true });
}
