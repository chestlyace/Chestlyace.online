import type { Metadata } from "next";
import { PostEditor } from "@/components/admin/blog/PostEditor";
import { previewBody } from "@/components/admin/blog/previewBody";

export const metadata: Metadata = { title: "New post" };

// A new post (design.md §14.19). It is created as a draft the first time it saves.
export default async function NewPostPage() {
  return <PostEditor initialPreview={await previewBody("")} />;
}
