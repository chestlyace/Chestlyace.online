import { deletePost, getPost, updatePost } from "@/lib/admin/blogApi";
import {
  failure,
  guard,
  json,
  parseId,
  publishedBlog,
  readBody,
} from "@/lib/admin/route";
import { getDb } from "@/lib/db";

// GET, PATCH and DELETE /api/admin/blog/<id>
export async function GET(
  request: Request,
  { params }: RouteContext<"/api/admin/blog/[id]">,
) {
  const denied = await guard(request, { body: false });
  if (denied) return denied;
  const id = parseId((await params).id);
  const post = id === null ? null : await getPost(getDb(), id);
  return post ? json({ item: post }) : json({ error: "not-found" }, 404);
}

export async function PATCH(
  request: Request,
  { params }: RouteContext<"/api/admin/blog/[id]">,
) {
  const denied = await guard(request, { body: true });
  if (denied) return denied;
  const id = parseId((await params).id);
  if (id === null) return json({ error: "not-found" }, 404);
  const result = await updatePost(getDb(), id, await readBody(request));
  if (!result.ok) return failure(result);
  publishedBlog();
  return json({ item: result.post });
}

export async function DELETE(
  request: Request,
  { params }: RouteContext<"/api/admin/blog/[id]">,
) {
  const denied = await guard(request, { body: false });
  if (denied) return denied;
  const id = parseId((await params).id);
  if (id === null) return json({ error: "not-found" }, 404);
  const result = await deletePost(getDb(), id);
  if (!result.ok) return failure(result);
  publishedBlog();
  return json({ ok: true });
}
