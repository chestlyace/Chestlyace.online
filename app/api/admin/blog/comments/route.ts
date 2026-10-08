import {
  listForModeration,
  type ModerationFilter,
} from "@/lib/admin/commentsApi";
import { guard, json } from "@/lib/admin/route";
import { getDb } from "@/lib/db";

// GET /api/admin/blog/comments?filter=all|reported|hidden: the comments to moderate,
// newest first.
export async function GET(request: Request) {
  const denied = await guard(request, { body: false });
  if (denied) return denied;
  const value = new URL(request.url).searchParams.get("filter");
  const filter: ModerationFilter =
    value === "reported" || value === "hidden" ? value : "all";
  return json({ items: await listForModeration(getDb(), filter) });
}
