import type { Metadata } from "next";
import { CommentList } from "@/components/admin/blog/CommentList";
import { listForModeration } from "@/lib/admin/commentsApi";
import { getDb } from "@/lib/db";

export const metadata: Metadata = { title: "Comments" };

// Readers' comments, to moderate (design.md §13.50, §14.19).
export default async function CommentsPage() {
  const rows = await listForModeration(getDb(), "all");
  return (
    <>
      <h1 className="text-title text-foreground">Comments</h1>
      <p className="mt-2 mb-8 text-body text-muted">
        What readers wrote under your posts. Hide, delete, or ban a reader when
        you need to.
      </p>
      <CommentList initial={rows} />
    </>
  );
}
