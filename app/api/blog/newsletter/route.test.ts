import { beforeEach, describe, expect, it, vi } from "vitest";
import { verifyToken } from "@/lib/newsletterServer";

const SECRET = "a-long-enough-secret-for-testing-0123456789";

function post(body: unknown, ip = "1.1.1.1", type = "application/json") {
  return new Request("https://blog.example/api/blog/newsletter", {
    method: "POST",
    headers: { "content-type": type, "x-forwarded-for": ip },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("POST /api/blog/newsletter", () => {
  let POST: (request: Request) => Promise<Response>;
  const fetchMock = vi.fn();

  beforeEach(async () => {
    vi.resetModules();
    fetchMock.mockReset().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("RESEND_API_KEY", "key");
    vi.stubEnv("NEWSLETTER_SECRET", SECRET);
    vi.stubEnv("RESEND_AUDIENCE_ID", "seg-1");
    vi.stubEnv("CONTACT_FROM_EMAIL", "Chestly Ace <hello@example.com>");
    ({ POST } = await import("./route"));
  });

  it("emails a confirmation link for the address, and adds nobody yet", async () => {
    const response = await POST(
      post({ email: " Ada@Example.com ", website: "" }),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    const mail = JSON.parse(init.body);
    expect(mail.to).toEqual(["ada@example.com"]);
    expect(mail.from).toBe("Chestly Ace <hello@example.com>");
    const link = mail.text.match(/https?:\/\/\S+/)[0];
    const token = new URL(link).searchParams.get("token");
    expect(new URL(link).pathname).toBe("/newsletter/confirm");
    expect(verifyToken(token, SECRET)).toBe("ada@example.com");
  });

  it("fakes success for a filled hidden field without sending", async () => {
    const response = await POST(
      post({ email: "ada@example.com", website: "http://spam.example" }),
    );
    expect(response.status).toBe(200);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refuses a bad address, a bad body and the wrong type", async () => {
    expect((await POST(post({ email: "nope" }, "4.4.4.1"))).status).toBe(422);
    expect((await POST(post({}, "4.4.4.2"))).status).toBe(422);
    expect((await POST(post("{not json", "4.4.4.3"))).status).toBe(400);
    expect((await POST(post("[]", "4.4.4.4"))).status).toBe(422);
    expect((await POST(post("x".repeat(3000), "4.4.4.5"))).status).toBe(413);
    expect(
      (await POST(post({ email: "a@b.co" }, "4.4.4.6", "text/plain"))).status,
    ).toBe(415);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("limits an address's tries by IP", async () => {
    for (let i = 0; i < 5; i++)
      expect(
        (await POST(post({ email: "ada@example.com" }, "9.9.9.9"))).status,
      ).toBe(200);
    const sixth = await POST(post({ email: "ada@example.com" }, "9.9.9.9"));
    expect(sixth.status).toBe(429);
    expect(sixth.headers.get("Retry-After")).toBeTruthy();
    expect(
      (await POST(post({ email: "ada@example.com" }, "8.8.8.8"))).status,
    ).toBe(200);
  });

  it("says so when it isn't set up, and when the email can't be sent", async () => {
    vi.stubEnv("NEWSLETTER_SECRET", "");
    expect(
      (await POST(post({ email: "ada@example.com" }, "2.2.2.2"))).status,
    ).toBe(503);
    vi.stubEnv("NEWSLETTER_SECRET", SECRET);
    fetchMock.mockResolvedValue({ ok: false });
    expect(
      (await POST(post({ email: "ada@example.com" }, "3.3.3.3"))).status,
    ).toBe(502);
  });
});
