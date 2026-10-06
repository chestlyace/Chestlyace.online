import { createHmac, timingSafeEqual } from "node:crypto";

// The admin's session (Q15, design.md §13.26): a signed token in an `httpOnly`
// cookie, with no `Domain`, so the browser sends it to the admin host only. The
// token is `v1.<payload>.<signature>`; the payload says when it was issued and
// when it expires, and the signature is an HMAC-SHA256 of it under
// SESSION_SECRET. Changing the secret ends every session.

export const SESSION_COOKIE = "admin_session";
export const SESSION_SECONDS = 7 * 24 * 60 * 60;
export const MIN_SECRET_LENGTH = 32;

const VERSION = "v1";

const sign = (payload: string, secret: string) =>
  createHmac("sha256", secret).update(payload).digest("base64url");

export function createSessionToken(
  secret: string,
  now: number = Date.now(),
): string {
  const payload = Buffer.from(
    JSON.stringify({
      iat: Math.floor(now / 1000),
      exp: Math.floor(now / 1000) + SESSION_SECONDS,
    }),
  ).toString("base64url");
  return `${VERSION}.${payload}.${sign(`${VERSION}.${payload}`, secret)}`;
}

export function verifySessionToken(
  token: string | undefined,
  secret: string | undefined,
  now: number = Date.now(),
): boolean {
  if (!token || !secret || secret.length < MIN_SECRET_LENGTH) return false;
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== VERSION) return false;

  const expected = Buffer.from(sign(`${parts[0]}.${parts[1]}`, secret));
  const given = Buffer.from(parts[2]);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
    return false;
  }

  try {
    const { exp, iat } = JSON.parse(
      Buffer.from(parts[1], "base64url").toString(),
    ) as { exp?: unknown; iat?: unknown };
    const seconds = now / 1000;
    return (
      typeof exp === "number" &&
      typeof iat === "number" &&
      iat <= seconds + 60 &&
      exp > seconds
    );
  } catch {
    return false;
  }
}

export const sessionCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_SECONDS,
});
