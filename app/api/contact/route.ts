import { NextResponse } from "next/server";
import { en } from "@/content/messages/en";
import { looksLikeBot, validateContact } from "@/lib/contact";
import { buildContactEmail, sendContactEmail } from "@/lib/contactMail";
import { getCachedHomepageData } from "@/lib/portfolio";
import { createRateLimiter } from "@/lib/rateLimit";

// The contact form's endpoint (Q10: email through Resend). Spam protection is a
// hidden field, a minimum time on the form, and a per-IP limit (design.md §13.15).
// The route is main-site only (proxy.ts passes /api through).

const MAX_BODY_BYTES = 20_000;
const limiter = createRateLimiter({ limit: 5, windowMs: 60 * 60 * 1000 });

function reply(
  body: Record<string, unknown>,
  status: number,
  headers?: HeadersInit,
) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store", ...headers },
  });
}

export async function POST(request: Request) {
  const forwarded = request.headers
    .get("x-forwarded-for")
    ?.split(",")[0]
    ?.trim();
  const ip = forwarded || request.headers.get("x-real-ip") || "unknown";
  const limit = limiter.check(ip);
  if (!limit.allowed) {
    return reply({ error: "rate-limited" }, 429, {
      "Retry-After": String(limit.retryAfterSeconds),
    });
  }

  if (!request.headers.get("content-type")?.includes("application/json")) {
    return reply({ error: "bad-request" }, 415);
  }
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

  const bot = looksLikeBot({
    website: body.website,
    elapsedMs: body.elapsedMs,
  });
  // A filled honeypot gets a fake success so the bot learns nothing.
  if (bot === "honeypot") return reply({ ok: true }, 200);
  if (bot === "too-fast") return reply({ error: "too-fast" }, 400);

  const result = validateContact(body, en.home.contact.form.errors);
  if (!result.ok)
    return reply({ error: "invalid", fields: result.errors }, 422);

  const apiKey = process.env.RESEND_API_KEY;
  const { profile } = await getCachedHomepageData();
  const to = process.env.CONTACT_TO_EMAIL || profile?.email;
  if (!apiKey || !to) return reply({ error: "not-configured" }, 503);

  const sent = await sendContactEmail(
    buildContactEmail(result.values, {
      to,
      from: process.env.CONTACT_FROM_EMAIL,
    }),
    apiKey,
  );
  if (!sent) return reply({ error: "send-failed" }, 502);
  return reply({ ok: true }, 200);
}
