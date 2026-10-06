import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/portfolio", () => ({
  getCachedHomepageData: async () => ({
    profile: { email: "owner@example.com" },
  }),
}));

const good = {
  name: "Ada",
  email: "ada@example.com",
  subject: "Collaboration",
  message: "I would like to work with you.",
  website: "",
  elapsedMs: 5000,
};

function post(body: unknown, ip = "1.1.1.1") {
  return new Request("http://localhost/api/contact", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("POST /api/contact", () => {
  let POST: (request: Request) => Promise<Response>;
  const fetchMock = vi.fn();

  beforeEach(async () => {
    vi.resetModules();
    fetchMock.mockReset().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("RESEND_API_KEY", "key");
    ({ POST } = await import("./route"));
  });

  it("emails a valid message to the profile address", async () => {
    const response = await POST(post(good));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    const sent = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(sent.to).toEqual(["owner@example.com"]);
    expect(sent.reply_to).toBe("ada@example.com");
  });

  it("fakes success for a filled honeypot without sending", async () => {
    const response = await POST(
      post({ ...good, website: "http://spam.example" }),
    );
    expect(response.status).toBe(200);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects an instant submit, bad fields and bad bodies", async () => {
    expect((await POST(post({ ...good, elapsedMs: 100 }))).status).toBe(400);
    const invalid = await POST(post({ ...good, email: "nope" }));
    expect(invalid.status).toBe(422);
    expect((await invalid.json()).fields.email).toBeTruthy();
    expect((await POST(post("not json"))).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("says so when email isn't configured or the send fails", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    expect((await POST(post(good))).status).toBe(503);
    vi.stubEnv("RESEND_API_KEY", "key");
    fetchMock.mockResolvedValue({ ok: false });
    expect((await POST(post(good))).status).toBe(502);
  });

  it("limits one address to five messages an hour", async () => {
    for (let i = 0; i < 5; i++)
      expect((await POST(post(good, "9.9.9.9"))).status).toBe(200);
    const blocked = await POST(post(good, "9.9.9.9"));
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("retry-after")).toBeTruthy();
    expect((await POST(post(good, "8.8.8.8"))).status).toBe(200);
  });
});
