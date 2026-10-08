import { getNewsletter, updateNewsletter } from "@/lib/admin/api";
import {
  failure,
  guard,
  json,
  publishedBlog,
  readBody,
} from "@/lib/admin/route";
import { getDb } from "@/lib/db";

// GET /api/admin/newsletter: the newsletter's wording and switch, as the blog
// shows them. PATCH: change the fields in the body (a row is created if there is
// none). One row, so no list, create or delete.
export async function GET(request: Request) {
  const denied = await guard(request, { body: false });
  if (denied) return denied;
  return json({ item: { id: 1, ...(await getNewsletter(getDb())) } });
}

export async function PATCH(request: Request) {
  const denied = await guard(request, { body: true });
  if (denied) return denied;
  const result = await updateNewsletter(getDb(), await readBody(request));
  if (!result.ok) return failure(result);
  publishedBlog();
  return json({ item: { id: 1, ...result.row } });
}
