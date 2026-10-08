import { describe, expect, it, vi } from "vitest";
import {
  TOKEN_TTL_MS,
  addSubscriber,
  buildConfirmEmail,
  signToken,
  verifyToken,
} from "./newsletterServer";

const SECRET = "a-long-enough-secret-for-testing-0123456789";

describe("confirmation links", () => {
  it("give back the address they were made for", () => {
    const token = signToken("ada@example.com", SECRET, 1000);
    expect(verifyToken(token, SECRET, 2000)).toBe("ada@example.com");
  });

  it("expire after 48 hours", () => {
    const token = signToken("ada@example.com", SECRET, 1000);
    expect(verifyToken(token, SECRET, 1000 + TOKEN_TTL_MS - 1)).toBe(
      "ada@example.com",
    );
    expect(verifyToken(token, SECRET, 1000 + TOKEN_TTL_MS + 1)).toBeNull();
  });

  it("are refused when forged, altered, signed with another secret or malformed", () => {
    const token = signToken("ada@example.com", SECRET, 1000);
    const [payload, signature] = token.split(".");
    const other = Buffer.from(
      `eve@example.com\n${1000 + TOKEN_TTL_MS}`,
    ).toString("base64url");
    expect(verifyToken(`${other}.${signature}`, SECRET, 2000)).toBeNull();
    expect(verifyToken(`${payload}.${signature}x`, SECRET, 2000)).toBeNull();
    expect(
      verifyToken(token, "another-secret-entirely-0123456789ab", 2000),
    ).toBeNull();
    for (const bad of [
      "",
      "x",
      "a.b.c",
      `${payload}.`,
      `.${signature}`,
      undefined,
      7,
      "a".repeat(700),
    ])
      expect(verifyToken(bad, SECRET, 2000)).toBeNull();
  });
});

describe("buildConfirmEmail", () => {
  it("carries the link in both versions and escapes it in the HTML", () => {
    const mail = buildConfirmEmail(
      "ada@example.com",
      'https://blog.example/newsletter/confirm?token=a&b="c"',
      "Blog <b@example.com>",
    );
    expect(mail.to).toEqual(["ada@example.com"]);
    expect(mail.from).toBe("Blog <b@example.com>");
    expect(mail.text).toContain('confirm?token=a&b="c"');
    expect(mail.html).toContain("token=a&amp;b=&quot;c&quot;");
    expect(buildConfirmEmail("a@b.co", "https://x.test").from).toMatch(
      /resend\.dev/,
    );
  });
});

describe("addSubscriber", () => {
  const options = { apiKey: "key", segmentId: "seg-1" };
  const reply = (ok: boolean) => ({ ok }) as Response;

  it("creates the contact in the segment, subscribed", async () => {
    const fetchMock = vi.fn().mockResolvedValue(reply(true));
    expect(await addSubscriber("ada@example.com", options, fetchMock)).toBe(
      true,
    );
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.resend.com/contacts");
    expect(init.method).toBe("POST");
    expect(init.headers.Authorization).toBe("Bearer key");
    expect(JSON.parse(init.body)).toEqual({
      email: "ada@example.com",
      unsubscribed: false,
      segments: [{ id: "seg-1" }],
    });
  });

  it("adds an existing contact to the segment and subscribes it again", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(reply(false))
      .mockResolvedValue(reply(true));
    expect(await addSubscriber("a+b@example.com", options, fetchMock)).toBe(
      true,
    );
    expect(
      fetchMock.mock.calls.map(([url, init]) => `${init.method} ${url}`),
    ).toEqual([
      "POST https://api.resend.com/contacts",
      "POST https://api.resend.com/contacts/a%2Bb%40example.com/segments/seg-1",
      "PATCH https://api.resend.com/contacts/a%2Bb%40example.com",
    ]);
    expect(JSON.parse(fetchMock.mock.calls[2][1].body)).toEqual({
      unsubscribed: false,
    });
  });

  it("is false when Resend refuses or can't be reached", async () => {
    expect(
      await addSubscriber(
        "a@b.co",
        options,
        vi.fn().mockResolvedValue(reply(false)),
      ),
    ).toBe(false);
    expect(
      await addSubscriber(
        "a@b.co",
        options,
        vi.fn().mockRejectedValue(new Error("down")),
      ),
    ).toBe(false);
    const half = vi
      .fn()
      .mockResolvedValueOnce(reply(false))
      .mockResolvedValueOnce(reply(true))
      .mockResolvedValueOnce(reply(false));
    expect(await addSubscriber("a@b.co", options, half)).toBe(false);
  });
});
