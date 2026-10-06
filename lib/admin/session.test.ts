import { describe, expect, it } from "vitest";
import {
  SESSION_SECONDS,
  createSessionToken,
  verifySessionToken,
} from "./session";

const secret = "a-long-enough-secret-for-testing-0123456789";

describe("session token", () => {
  it("verifies a fresh token", () => {
    const now = Date.now();
    expect(
      verifySessionToken(createSessionToken(secret, now), secret, now),
    ).toBe(true);
  });

  it("expires after 7 days", () => {
    const now = Date.now();
    const token = createSessionToken(secret, now);
    expect(
      verifySessionToken(token, secret, now + (SESSION_SECONDS - 5) * 1000),
    ).toBe(true);
    expect(
      verifySessionToken(token, secret, now + (SESSION_SECONDS + 5) * 1000),
    ).toBe(false);
  });

  it("rejects a token signed with another secret, so changing it ends every session", () => {
    const token = createSessionToken(secret);
    expect(verifySessionToken(token, secret + "x")).toBe(false);
  });

  it("rejects tampering, junk and missing values", () => {
    const token = createSessionToken(secret);
    const [v, payload, signature] = token.split(".");
    const forged = Buffer.from(
      JSON.stringify({ iat: 1, exp: 9999999999 }),
    ).toString("base64url");
    expect(verifySessionToken(`${v}.${forged}.${signature}`, secret)).toBe(
      false,
    );
    expect(
      verifySessionToken(`${v}.${payload}.${signature.slice(1)}x`, secret),
    ).toBe(false);
    expect(verifySessionToken(`v2.${payload}.${signature}`, secret)).toBe(
      false,
    );
    for (const junk of [undefined, "", "abc", "a.b", "a.b.c.d"]) {
      expect(verifySessionToken(junk, secret)).toBe(false);
    }
  });

  it("refuses to work without a proper secret", () => {
    const token = createSessionToken(secret);
    expect(verifySessionToken(token, undefined)).toBe(false);
    expect(verifySessionToken(token, "short")).toBe(false);
  });

  it("rejects a token from the future", () => {
    const now = Date.now();
    expect(
      verifySessionToken(
        createSessionToken(secret, now + 3_600_000),
        secret,
        now,
      ),
    ).toBe(false);
  });
});
