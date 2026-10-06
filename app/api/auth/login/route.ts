import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyPassword } from "@/lib/admin/password";
import { clientIp, isSameOrigin, safeNext } from "@/lib/admin/request";
import {
  MIN_SECRET_LENGTH,
  SESSION_COOKIE,
  createSessionToken,
  sessionCookieOptions,
} from "@/lib/admin/session";
import { createRateLimiter } from "@/lib/rateLimit";

// POST /api/auth/login (admin host only, D71): checks the password against
// ADMIN_PASSWORD_HASH and sets the session cookie. Five failed attempts per IP in
// fifteen minutes, then a wait; every attempt takes at least 400ms (design.md
// §13.26). The limit is in memory, per server instance, like the contact form's.

const limiter = createRateLimiter({ limit: 5, windowMs: 15 * 60 * 1000 });
const MIN_ATTEMPT_MS = 400;

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
  if (!isSameOrigin(request)) return reply({ error: "forbidden" }, 403);
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return reply({ error: "bad-request" }, 415);
  }

  const secret = process.env.SESSION_SECRET;
  if (
    !process.env.ADMIN_PASSWORD_HASH ||
    !secret ||
    secret.length < MIN_SECRET_LENGTH
  ) {
    return reply({ error: "not-configured" }, 503);
  }

  const ip = clientIp(request);
  const attempt = limiter.check(ip);
  if (!attempt.allowed) {
    return reply(
      { error: "rate-limited", retryAfterSeconds: attempt.retryAfterSeconds },
      429,
      { "Retry-After": String(attempt.retryAfterSeconds) },
    );
  }

  let body: { password?: unknown; next?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return reply({ error: "bad-request" }, 400);
  }

  const started = Date.now();
  const ok =
    typeof body.password === "string" &&
    (await verifyPassword(body.password, process.env.ADMIN_PASSWORD_HASH));
  const wait = MIN_ATTEMPT_MS - (Date.now() - started);
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));

  if (!ok) return reply({ error: "invalid" }, 401);

  limiter.clear(ip);
  (await cookies()).set(
    SESSION_COOKIE,
    createSessionToken(secret),
    sessionCookieOptions(),
  );
  return reply(
    {
      ok: true,
      next: safeNext(typeof body.next === "string" ? body.next : null),
    },
    200,
  );
}
