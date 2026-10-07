import { Prose } from "@/components/blog/Prose";
import { proseComponents } from "@/components/blog/proseComponents";
import { renderMarkdown } from "@/lib/blog/markdown";

// A post's body as readers see it: the public renderer and components (design.md
// §13.48). Rendered by the editor's pages for the first view and by the preview
// action after that; the pages importing it is also what puts the blocks' client
// components in their client manifest, which the action's result needs.
export async function previewBody(markdown: string) {
  const { content } = await renderMarkdown(
    markdown.slice(0, 200_000),
    proseComponents,
  );
  return <Prose>{content}</Prose>;
}
