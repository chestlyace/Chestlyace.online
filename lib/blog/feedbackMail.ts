// The owner's email about feedback on a shared draft (design.md §13.71, D93), sent
// through Resend like the comments' (lib/blog/commentMail.ts): the post's title, the
// name, the text and a link to the editor's Feedback tab.
const oneLine = (text: string) =>
  text.replace(/[\r\n\u0000-\u001f]+/g, " ").trim();

const escapeHtml = (text: string) =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export function buildFeedbackEmail(
  input: {
    postTitle: string;
    /** The editor's Feedback tab in the admin. */
    editorUrl: string;
    name: string;
    body: string;
  },
  options: { to: string; from?: string },
): { from: string; to: string[]; subject: string; text: string; html: string } {
  const name = oneLine(input.name);
  return {
    from: options.from || "Blog feedback <onboarding@resend.dev>",
    to: [options.to],
    subject: `[Blog] Feedback on your draft “${oneLine(input.postTitle)}” from ${name}`,
    text: `${name} sent feedback on your draft “${input.postTitle}”:\n\n${input.body}\n\n—\n${input.editorUrl}`,
    html: `<p><strong>${escapeHtml(name)}</strong> sent feedback on your draft <a href="${escapeHtml(input.editorUrl)}">${escapeHtml(input.postTitle)}</a>:</p><p style="white-space:pre-wrap">${escapeHtml(input.body)}</p>`,
  };
}
