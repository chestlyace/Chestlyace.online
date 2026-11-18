import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostEditor } from "@/components/admin/blog/PostEditor";
import { previewBody } from "@/components/admin/blog/previewBody";
import { getPost } from "@/lib/admin/blogApi";
import { listFeedback } from "@/lib/blog/draftFeedback";
import { snapshotOf } from "@/lib/admin/blogForm";
import { parseId } from "@/lib/admin/route";
import { getDb } from "@/lib/db";

export const metadata: Metadata = { title: "Edit post" };

// One post's editor (design.md §14.19).
export default async function EditPostPage({
  params,
  searchParams,
}: PageProps<"/sites/admin/blog/[id]">) {
  const id = parseId((await params).id);
  const post = id === null ? null : await getPost(getDb(), id);
  if (!post) notFound();
  const feedback = await listFeedback(getDb(), post.id);
  // The feedback email links straight to the Feedback tab (design.md §13.71).
  const openFeedback = (await searchParams).tab === "feedback";
  return (
    <PostEditor
      key={post.id}
      id={post.id}
      initial={snapshotOf(post)}
      devtoUrl={post.devtoUrl}
      feedback={feedback}
      initialTab={openFeedback ? "feedback" : "write"}
      share={
        post.shareToken && post.shareCreatedAt
          ? {
              token: post.shareToken,
              createdAt: post.shareCreatedAt.toISOString(),
            }
          : null
      }
      initialPreview={await previewBody(post.content)}
    />
  );
}
