import type { ContactValues } from "./contact";

// Sending a contact message through Resend's HTTP API (Q10). No SDK: it is one
// POST, and a plain `fetch` is easy to test.

const RESEND_URL = "https://api.resend.com/emails";
const DEFAULT_FROM = "Portfolio contact <onboarding@resend.dev>";

// Header values (the subject) must not carry line breaks.
function oneLine(text: string): string {
  return text.replace(/[\r\n\u0000-\u001f]+/g, " ").trim();
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildContactEmail(
  values: ContactValues,
  options: { to: string; from?: string },
) {
  const name = oneLine(values.name);
  return {
    from: options.from || DEFAULT_FROM,
    to: [options.to],
    reply_to: values.email,
    subject: `[Portfolio] ${oneLine(values.subject)} — ${name}`,
    text: `${values.message}\n\n—\n${name} <${values.email}>\n${values.subject}`,
    html: `<p style="white-space:pre-wrap">${escapeHtml(values.message)}</p><hr><p>${escapeHtml(name)} &lt;${escapeHtml(values.email)}&gt;<br>${escapeHtml(values.subject)}</p>`,
  };
}

export async function sendContactEmail(
  email: object,
  apiKey: string,
  fetchImpl: typeof fetch = fetch,
): Promise<boolean> {
  try {
    const response = await fetchImpl(RESEND_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(email),
    });
    return response.ok;
  } catch {
    return false;
  }
}
