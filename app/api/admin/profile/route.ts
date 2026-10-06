import { getProfile, updateProfile } from "@/lib/admin/api";
import { failure, guard, json, published, readBody } from "@/lib/admin/route";
import { getDb } from "@/lib/db";

// GET /api/admin/profile: the profile row. PATCH: change the fields in the
// body. There is exactly one row, so no list, create or delete.
export async function GET(request: Request) {
  const denied = await guard(request, { body: false });
  if (denied) return denied;
  const row = await getProfile(getDb());
  return row ? json({ item: row }) : json({ error: "not-found" }, 404);
}

export async function PATCH(request: Request) {
  const denied = await guard(request, { body: true });
  if (denied) return denied;
  const result = await updateProfile(getDb(), await readBody(request));
  if (!result.ok) return failure(result);
  published();
  return json({ item: result.row });
}
