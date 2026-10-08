import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostEditor } from "@/components/admin/blog/PostEditor";
import { previewBody } from "@/components/admin/blog/previewBody";
import { getPost } from "@/lib/admin/blogApi";
import { snapshotOf } from "@/lib/admin/blogForm";
import { parseId } from "@/lib/admin/route";
import { getDb } from "@/lib/db";

export const metadata: Metadata = { title: "Edit post" };

// One post's editor (design.md §14.19).
export default async function EditPostPage({
  params,
}: PageProps<"/sites/admin/blog/[id]">) {
  const id = parseId((await params).id);
  const post = id === null ? null : await getPost(getDb(), id);
  if (!post) notFound();
  return (
    <PostEditor
      key={post.id}
      id={post.id}
      initial={snapshotOf(post)}
      devtoUrl={post.devtoUrl}
      initialPreview={await previewBody(post.content)}
    />
  );
}
