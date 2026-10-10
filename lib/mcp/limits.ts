import { createRateLimiter } from "@/lib/rateLimit";

// Per-token limits (docs/mcp.md §3): 120 requests a minute and 30 writes a minute. In
// memory, per server instance, like the contact form's limiter: a speed bump against an
// agent stuck in a loop, not an exact global limit.

const requests = createRateLimiter({ limit: 120, windowMs: 60_000 });
const writes = createRateLimiter({ limit: 30, windowMs: 60_000 });

export type Limit =
  { allowed: true } | { allowed: false; retryAfterSeconds: number };

export function checkRequest(tokenId: number, now?: number): Limit {
  const result = requests.check(String(tokenId), now);
  return result.allowed
    ? { allowed: true }
    : { allowed: false, retryAfterSeconds: result.retryAfterSeconds };
}

export function checkWrite(tokenId: number, now?: number): Limit {
  const result = writes.check(String(tokenId), now);
  return result.allowed
    ? { allowed: true }
    : { allowed: false, retryAfterSeconds: result.retryAfterSeconds };
}

/** For tests. */
export function resetLimits(tokenId: number) {
  requests.clear(String(tokenId));
  writes.clear(String(tokenId));
}
