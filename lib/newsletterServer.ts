import { createHmac, timingSafeEqual } from "node:crypto";
import type { NewsletterCopy } from "@/lib/newsletterCopy";

// The newsletter behind the box (design.md §13.34, §14.16), without HTTP. Double
// opt-in with nothing stored here: the confirmation link is the address and an
// expiry signed with NEWSLETTER_SECRET, and a subscriber is only added to Resend
// when the link is opened. Resend is called with `fetch`, as the contact form's
// email is.

export const TOKEN_TTL_MS = 48 * 60 * 60 * 1000;

const b64 = (text: string) => Buffer.from(text).toString("base64url");
const sign = (payload: string, secret: string) =>
  createHmac("sha256", secret).update(payload).digest("base64url");

export function signToken(
  email: string,
  secret: string,
  now: number = Date.now(),
): string {
  const payload = b64(`${email}\n${now + TOKEN_TTL_MS}`);
  return `${payload}.${sign(payload, secret)}`;
}

/** The address a link was made for, or null when it is forged, malformed or expired. */
export function verifyToken(
  token: unknown,
  secret: string,
  now: number = Date.now(),
): string | null {
  if (typeof token !== "string" || token.length > 600) return null;
  const [payload, signature, ...rest] = token.split(".");
  if (!payload || !signature || rest.length) return null;
  const expected = Buffer.from(sign(payload, secret));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given))
    return null;
  const [email, expires] = Buffer.from(payload, "base64url")
    .toString()
    .split("\n");
  if (!email || !(Number(expires) > now)) return null;
  return email;
}

const escapeHtml = (text: string) =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export function buildConfirmEmail(
  to: string,
  link: string,
  copy: NewsletterCopy["email"],
  from?: string,
): { from: string; to: string[]; subject: string; text: string; html: string } {
  return {
    from: from || "Chestly Ace blog <onboarding@resend.dev>",
    to: [to],
    subject: copy.subject,
    text: `${copy.intro}\n\n${copy.action}: ${link}\n\n${copy.expires}\n${copy.ignore}`,
    html: `<p>${escapeHtml(copy.intro)}</p><p><a href="${escapeHtml(link)}">${escapeHtml(copy.action)}</a></p><p style="color:#6e6e73">${escapeHtml(copy.expires)}<br>${escapeHtml(copy.ignore)}</p>`,
  };
}

const RESEND = "https://api.resend.com";

// Adds a confirmed address to the segment (Resend's Contacts API; Audiences are
// now Segments there). A new contact is created in the segment; one that exists
// is added to it and marked subscribed again, since they just confirmed.
export async function addSubscriber(
  email: string,
  options: { apiKey: string; segmentId: string },
  fetchImpl: typeof fetch = fetch,
): Promise<boolean> {
  const call = (method: string, path: string, body?: object) =>
    fetchImpl(`${RESEND}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${options.apiKey}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  try {
    const created = await call("POST", "/contacts", {
      email,
      unsubscribed: false,
      segments: [{ id: options.segmentId }],
    });
    if (created.ok) return true;

    const who = encodeURIComponent(email);
    const added = await call(
      "POST",
      `/contacts/${who}/segments/${encodeURIComponent(options.segmentId)}`,
    );
    if (!added.ok) return false;
    const back = await call("PATCH", `/contacts/${who}`, {
      unsubscribed: false,
    });
    return back.ok;
  } catch {
    return false;
  }
}
