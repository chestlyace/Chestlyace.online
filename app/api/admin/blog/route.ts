import { createPost, listPosts } from "@/lib/admin/blogApi";
import {
  failure,
  guard,
  json,
  publishedBlog,
  readBody,
} from "@/lib/admin/route";
import { getDb } from "@/lib/db";

// GET /api/admin/blog: every post, drafts included, newest first.
export async function GET(request: Request) {
  const denied = await guard(request, { body: false });
  if (denied) return denied;
  return json({ items: await listPosts(getDb()) });
}

// POST /api/admin/blog: a new post (a draft unless the body says otherwise).
export async function POST(request: Request) {
  const denied = await guard(request, { body: true });
  if (denied) return denied;
  const result = await createPost(getDb(), await readBody(request));
  if (!result.ok) return failure(result);
  publishedBlog();
  return json({ item: result.post }, 201);
}
