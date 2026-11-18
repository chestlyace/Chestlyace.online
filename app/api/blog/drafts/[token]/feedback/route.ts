import { after, NextResponse } from "next/server";
import { looksLikeBot } from "@/lib/contact";
import { sendContactEmail } from "@/lib/contactMail";
import { normalise } from "@/lib/blog/commentText";
import { addFeedback, feedbackMaxWords } from "@/lib/blog/draftFeedback";
import { buildFeedbackEmail } from "@/lib/blog/feedbackMail";
import { getDb } from "@/lib/db";
import { isLang } from "@/lib/i18n";
import { getCachedHomepageData } from "@/lib/portfolio";
import { createRateLimiter } from "@/lib/rateLimit";
import { siteUrl } from "@/lib/sites";

// POST /api/blog/drafts/<token>/feedback: private feedback on a shared draft (D93,
// design.md §13.69). No account: the contact form's spam protection (a hidden field
// and a minimum time on the form), 10 sends an hour per IP and link, and the same
// text twice in a row from one IP is refused. The owner is emailed.

const MAX_BODY_BYTES = 40_000;
const limiter = createRateLimiter({ limit: 10, windowMs: 60 * 60 * 1000 });
// The last text each IP sent (in memory, per server instance, as the limiter).
const lastSent = new Map<string, string>();

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

export async function POST(
  request: Request,
  { params }: RouteContext<"/api/blog/drafts/[token]/feedback">,
) {
  const { token } = await params;
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const limit = limiter.check(`${ip}|${token}`);
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
    if (typeof parsed !== "object" || parsed === null) throw new Error();
    body = parsed as Record<string, unknown>;
  } catch {
    return reply({ error: "bad-request" }, 400);
  }

  const bot = looksLikeBot({ website: body.website, elapsedMs: body.elapsedMs });
  // A filled hidden field gets a fake success, so a bot learns nothing.
  if (bot === "honeypot") return reply({ ok: true }, 201);
  if (bot === "too-fast") return reply({ error: "too-fast" }, 400);

  const name = typeof body.name === "string" ? body.name : "";
  const message = typeof body.body === "string" ? body.body : "";
  const lang = isLang(body.lang) ? body.lang : "en";

  const repeat = normalise(message);
  if (repeat && lastSent.get(ip) === repeat)
    return reply({ error: "duplicate" }, 409);

  const db = getDb();
  const result = await addFeedback(
    db,
    { token, name, body: message, lang },
    { maxWords: feedbackMaxWords() },
  );
  if (!result.ok)
    return result.status === 404
      ? reply({ error: "not-shared" }, 404)
      : reply({ error: "invalid", fields: result.fields }, 422);

  lastSent.set(ip, repeat);
  if (lastSent.size > 1000) {
    const oldest = lastSent.keys().next().value;
    if (oldest !== undefined) lastSent.delete(oldest);
  }

  // The owner hears about it, after the reader has their answer.
  after(async () => {
    const apiKey = process.env.RESEND_API_KEY;
    const { profile } = await getCachedHomepageData();
    const to = process.env.CONTACT_TO_EMAIL || profile?.email;
    if (!apiKey || !to) return;
    await sendContactEmail(
      buildFeedbackEmail(
        {
          postTitle: result.post.title,
          editorUrl: siteUrl("admin", `/blog/${result.post.id}?tab=feedback`),
          name: result.feedback.name,
          body: result.feedback.body,
        },
        { to, from: process.env.CONTACT_FROM_EMAIL },
      ),
      apiKey,
    );
  });

  return reply({ ok: true }, 201);
}
