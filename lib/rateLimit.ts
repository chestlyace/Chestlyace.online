// A small in-memory limiter for the contact route: at most `limit` hits per key
// in a sliding window. Memory is per server instance, so on a serverless host it
// is a speed bump against a bot hammering one instance, not an exact global
// limit (the honeypot and the timing check do the rest).

export function createRateLimiter({
  limit,
  windowMs,
}: {
  limit: number;
  windowMs: number;
}) {
  const hits = new Map<string, number[]>();

  return {
    // Forgets a key's hits (a successful login clears its failed attempts).
    clear(key: string) {
      hits.delete(key);
    },
    check(key: string, now: number = Date.now()) {
      const recent = (hits.get(key) ?? []).filter(
        (time) => now - time < windowMs,
      );
      if (recent.length >= limit) {
        hits.set(key, recent);
        return {
          allowed: false,
          retryAfterSeconds: Math.ceil((recent[0] + windowMs - now) / 1000),
        };
      }
      recent.push(now);
      hits.set(key, recent);

      // Forget keys that have gone quiet, so the map can't grow without bound.
      if (hits.size > 1000) {
        for (const [k, times] of hits) {
          if (times.every((time) => now - time >= windowMs)) hits.delete(k);
        }
      }
      return { allowed: true, retryAfterSeconds: 0 };
    },
  };
}
