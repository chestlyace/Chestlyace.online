import { z } from "zod";
import { deleteComment, setCommentStatus } from "@/lib/admin/commentsApi";
import {
  guard,
  json,
  parseId,
  publishedBlog,
  readBody,
} from "@/lib/admin/route";
import { getDb } from "@/lib/db";

const body = z.object({ status: z.enum(["visible", "hidden"]) }).strict();

// PATCH /api/admin/blog/comments/<id>: hide or show a comment.
export async function PATCH(
  request: Request,
  { params }: RouteContext<"/api/admin/blog/comments/[id]">,
) {
  const denied = await guard(request, { body: true });
  if (denied) return denied;
  const id = parseId((await params).id);
  const parsed = body.safeParse(await readBody(request));
  if (id === null) return json({ error: "not-found" }, 404);
  if (!parsed.success) return json({ error: "invalid" }, 422);
  if (!(await setCommentStatus(getDb(), id, parsed.data.status)))
    return json({ error: "not-found" }, 404);
  publishedBlog();
  return json({ ok: true });
}

// DELETE /api/admin/blog/comments/<id>: remove a comment (and its replies).
export async function DELETE(
  request: Request,
  { params }: RouteContext<"/api/admin/blog/comments/[id]">,
) {
  const denied = await guard(request, { body: false });
  if (denied) return denied;
  const id = parseId((await params).id);
  if (id === null || !(await deleteComment(getDb(), id)))
    return json({ error: "not-found" }, 404);
  publishedBlog();
  return json({ ok: true });
}
