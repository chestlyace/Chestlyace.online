import { NextResponse } from "next/server";
import { getNewsletterCopy } from "@/lib/blog/data";
import { getDb } from "@/lib/db";
import { cleanEmail } from "@/lib/newsletter";
import { buildConfirmEmail, signToken } from "@/lib/newsletterServer";
import { sendContactEmail } from "@/lib/contactMail";
import { DEFAULT_LANG, isLang, localizedPath } from "@/lib/i18n";
import { createRateLimiter } from "@/lib/rateLimit";
import { siteUrl } from "@/lib/sites";

// POST /api/blog/newsletter: the box's signup (design.md §13.34). It only emails a
// confirmation link; the address is added when the link is opened (§14.16). Spam
// protection is the contact form's: a hidden field and a per-IP limit (D69). The
// answer never says whether an address is already subscribed.

const MAX_BODY_BYTES = 2_000;
const limiter = createRateLimiter({ limit: 5, windowMs: 60 * 60 * 1000 });

const reply = (
  body: Record<string, unknown>,
  status: number,
  headers?: HeadersInit,
) =>
  NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store", ...headers },
  });

export async function POST(request: Request) {
  const forwarded = request.headers
    .get("x-forwarded-for")
    ?.split(",")[0]
    ?.trim();
  const ip = forwarded || request.headers.get("x-real-ip") || "unknown";
  const limit = limiter.check(ip);
  if (!limit.allowed)
    return reply({ error: "rate-limited" }, 429, {
      "Retry-After": String(limit.retryAfterSeconds),
    });

  if (!request.headers.get("content-type")?.includes("application/json"))
    return reply({ error: "bad-request" }, 415);
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) return reply({ error: "bad-request" }, 413);

  let body: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(text);
    if (typeof parsed !== "object" || parsed === null)
      throw new Error("not an object");
    body = parsed as Record<string, unknown>;
  } catch {
    return reply({ error: "bad-request" }, 400);
  }

  // A filled hidden field gets a fake success, so a bot learns nothing.
  if (typeof body.website === "string" && body.website.trim() !== "")
    return reply({ ok: true }, 200);

  const email = cleanEmail(body.email);
  if (!email) return reply({ error: "invalid" }, 422);

  // The wording, the confirmation email and the link's page follow the page the
  // signup came from (docs/i18n.md §8).
  const lang = isLang(body.lang) ? body.lang : DEFAULT_LANG;
  const copy = await getNewsletterCopy(getDb(), lang);
  if (!copy.enabled) return reply({ error: "disabled" }, 404);

  const apiKey = process.env.RESEND_API_KEY;
  const secret = process.env.NEWSLETTER_SECRET;
  if (!apiKey || !secret || !process.env.RESEND_AUDIENCE_ID)
    return reply({ error: "not-configured" }, 503);

  const link = siteUrl(
    "blog",
    localizedPath(
      `/newsletter/confirm?token=${encodeURIComponent(signToken(email, secret))}`,
      lang,
    ),
  );
  const sent = await sendContactEmail(
    buildConfirmEmail(email, link, copy.email, process.env.CONTACT_FROM_EMAIL),
    apiKey,
  );
  if (!sent) return reply({ error: "send-failed" }, 502);
  return reply({ ok: true }, 200);
}
