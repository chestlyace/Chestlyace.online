import { getCreativesSettings, updateCreativesSettings } from "@/lib/admin/api";
import {
  failure,
  guard,
  json,
  publishedCreatives,
  readBody,
} from "@/lib/admin/route";
import { getDb } from "@/lib/db";

// GET /api/admin/creatives-settings: the creatives site's wording as it is shown.
// PATCH: change the fields in the body (a row is created if there is none). One
// row, so no list, create or delete.
export async function GET(request: Request) {
  const denied = await guard(request, { body: false });
  if (denied) return denied;
  return json({ item: { id: 1, ...(await getCreativesSettings(getDb())) } });
}

export async function PATCH(request: Request) {
  const denied = await guard(request, { body: true });
  if (denied) return denied;
  const result = await updateCreativesSettings(
    getDb(),
    await readBody(request),
  );
  if (!result.ok) return failure(result);
  publishedCreatives();
  return json({ item: { id: 1, ...result.row } });
}
