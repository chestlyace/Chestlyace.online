// The owner's email about a new comment (design.md §13.37), sent through Resend
// like the contact form's (lib/contactMail.ts: sendContactEmail posts any email).
const oneLine = (text: string) =>
  text.replace(/[\r\n\u0000-\u001f]+/g, " ").trim();

const escapeHtml = (text: string) =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export function buildCommentEmail(
  input: {
    postTitle: string;
    postUrl: string;
    author: string;
    body: string;
    reply: boolean;
  },
  options: { to: string; from?: string },
): { from: string; to: string[]; subject: string; text: string; html: string } {
  const author = oneLine(input.author);
  const what = input.reply ? "reply" : "comment";
  return {
    from: options.from || "Blog comments <onboarding@resend.dev>",
    to: [options.to],
    subject: `[Blog] New ${what} on “${oneLine(input.postTitle)}” from ${author}`,
    text: `${author} wrote a ${what} on “${input.postTitle}”:\n\n${input.body}\n\n—\n${input.postUrl}#comments`,
    html: `<p><strong>${escapeHtml(author)}</strong> wrote a ${what} on <a href="${escapeHtml(input.postUrl)}#comments">${escapeHtml(input.postTitle)}</a>:</p><p style="white-space:pre-wrap">${escapeHtml(input.body)}</p>`,
  };
}
