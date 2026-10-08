import { z } from "zod";
import { updateReader } from "@/lib/admin/commentsApi";
import { guard, json, publishedBlog, readBody } from "@/lib/admin/route";
import { getDb } from "@/lib/db";

const body = z
  .object({ banned: z.boolean().optional(), isAuthor: z.boolean().optional() })
  .strict();

// PATCH /api/admin/blog/readers/<id>: ban or unban a reader, or mark their account
// as the author's (the AUTHOR tag on its comments).
export async function PATCH(
  request: Request,
  { params }: RouteContext<"/api/admin/blog/readers/[id]">,
) {
  const denied = await guard(request, { body: true });
  if (denied) return denied;
  const { id } = await params;
  const parsed = body.safeParse(await readBody(request));
  if (!/^[\w-]{1,64}$/.test(id)) return json({ error: "not-found" }, 404);
  if (!parsed.success || Object.keys(parsed.data).length === 0)
    return json({ error: "invalid" }, 422);
  if (!(await updateReader(getDb(), id, parsed.data)))
    return json({ error: "not-found" }, 404);
  publishedBlog();
  return json({ ok: true });
}
