import { NextResponse } from "next/server";
import { clientIp, isSameOrigin } from "@/lib/admin/request";
import { getReader, type Reader } from "./auth";
import { createRateLimiter } from "@/lib/rateLimit";

// What the comment routes share: the answer format, the same-origin check, who is
// signed in (and not banned), and the limits.
export const reply = (body: unknown, status = 200, headers?: HeadersInit) =>
  NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store", ...headers },
  });

// Writes by one reader: a few a minute, and not many more in an hour.
const perMinute = createRateLimiter({ limit: 6, windowMs: 60 * 1000 });
const perHour = createRateLimiter({ limit: 40, windowMs: 60 * 60 * 1000 });
// Cheap actions (likes, reports) get a roomier limit.
const actions = createRateLimiter({ limit: 40, windowMs: 60 * 1000 });
const perIp = createRateLimiter({ limit: 120, windowMs: 60 * 1000 });

export type Guarded = { reader: Reader } | { response: NextResponse };

export async function guardWrite(
  request: Request,
  kind: "comment" | "action",
): Promise<Guarded> {
  if (!isSameOrigin(request))
    return { response: reply({ error: "forbidden" }, 403) };
  const ip = perIp.check(clientIp(request));
  if (!ip.allowed)
    return {
      response: reply({ error: "rate-limited" }, 429, {
        "Retry-After": String(ip.retryAfterSeconds),
      }),
    };
  const reader = await getReader(request.headers);
  if (!reader) return { response: reply({ error: "unauthorized" }, 401) };
  if (reader.banned) return { response: reply({ error: "banned" }, 403) };

  const checks = kind === "comment" ? [perMinute, perHour] : [actions];
  for (const limiter of checks) {
    const result = limiter.check(reader.id);
    if (!result.allowed)
      return {
        response: reply(
          { error: "rate-limited", message: "Slow down a little." },
          429,
          {
            "Retry-After": String(result.retryAfterSeconds),
          },
        ),
      };
  }
  return { reader };
}

export const parseId = (value: string): number | null =>
  /^[1-9]\d{0,9}$/.test(value) ? Number(value) : null;
