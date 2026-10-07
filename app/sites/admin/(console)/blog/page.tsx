import type { Metadata } from "next";
import { PostList } from "@/components/admin/blog/PostList";
import { listPosts } from "@/lib/admin/blogApi";
import { getDb } from "@/lib/db";

export const metadata: Metadata = { title: "Posts" };

// The blog's posts, drafts included (design.md §14.19).
export default async function PostsPage() {
  const posts = await listPosts(getDb());
  return (
    <>
      <h1 className="text-title text-foreground">Posts</h1>
      <p className="mt-2 mb-8 text-body text-muted">
        Everything you write for the blog, drafts and published.
      </p>
      <PostList initial={posts} />
    </>
  );
}
