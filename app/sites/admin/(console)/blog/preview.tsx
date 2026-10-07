"use server";

import type { ReactNode } from "react";
import { previewBody } from "@/components/admin/blog/previewBody";
import { hasSession } from "@/lib/admin/auth";

// The editor's preview (design.md §13.48): the post's markdown rendered on the
// server and handed to the editor to show. Only a signed-in admin can ask.
export async function renderPreview(markdown: string): Promise<ReactNode> {
  if (!(await hasSession())) return null;
  return previewBody(markdown);
}
