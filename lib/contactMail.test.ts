import { describe, expect, it, vi } from "vitest";
import { buildContactEmail, sendContactEmail } from "./contactMail";

const values = {
  name: "Ada\r\nBcc: evil@example.com",
  email: "ada@example.com",
  subject: "Collaboration",
  message: "Hello <b>there</b> & welcome",
};

describe("buildContactEmail", () => {
  const email = buildContactEmail(values, { to: "me@example.com" });

  it("addresses the owner and replies to the visitor", () => {
    expect(email.to).toEqual(["me@example.com"]);
    expect(email.reply_to).toBe("ada@example.com");
    expect(email.from).toContain("resend.dev");
  });

  it("keeps line breaks out of the subject", () => {
    expect(email.subject).not.toMatch(/[\r\n]/);
    expect(email.subject).toBe(
      "[Portfolio] Collaboration — Ada Bcc: evil@example.com",
    );
  });

  it("escapes the message in the HTML body", () => {
    expect(email.html).toContain(
      "Hello &lt;b&gt;there&lt;/b&gt; &amp; welcome",
    );
    expect(email.html).not.toContain("<b>");
  });
});

describe("sendContactEmail", () => {
  const email = buildContactEmail(
    { ...values, name: "Ada" },
    { to: "me@example.com" },
  );

  it("posts with the key and reports success", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    expect(await sendContactEmail(email, "key", fetchMock as never)).toBe(true);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.headers.Authorization).toBe("Bearer key");
  });

  it("reports failure for an error response or a network error", async () => {
    expect(
      await sendContactEmail(
        email,
        "k",
        vi.fn().mockResolvedValue({ ok: false }) as never,
      ),
    ).toBe(false);
    expect(
      await sendContactEmail(
        email,
        "k",
        vi.fn().mockRejectedValue(new Error("down")) as never,
      ),
    ).toBe(false);
  });
});
