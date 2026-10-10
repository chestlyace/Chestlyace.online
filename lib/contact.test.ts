import { describe, expect, it } from "vitest";
import {
  displayPhone,
  fieldError,
  looksLikeBot,
  validateContact,
  whatsappHref,
  whatsappText,
} from "./contact";
import { en } from "@/content/messages/en";

const messages = en.home.contact.form.errors;

const good = {
  name: "Ada",
  email: "ada@example.com",
  subject: "Collaboration",
  message: "I would like to work with you.",
};

describe("fieldError", () => {
  it("checks each field", () => {
    expect(fieldError("name", "  ", messages)).toMatch(/name/i);
    expect(fieldError("name", "Ada", messages)).toBeNull();
    expect(fieldError("email", "nope", messages)).toMatch(/valid email/i);
    expect(fieldError("email", "a@b.co", messages)).toBeNull();
    expect(fieldError("subject", "Other", messages)).toMatch(/choose/i);
    expect(fieldError("subject", "Job Opportunity", messages)).toBeNull();
    expect(fieldError("message", "short", messages)).toMatch(/more detail/i);
    expect(fieldError("message", "x".repeat(5001), messages)).toMatch(
      /too long/i,
    );
  });
});

describe("validateContact", () => {
  it("returns trimmed values when everything is fine", () => {
    expect(validateContact({ ...good, name: "  Ada " }, messages)).toEqual({
      ok: true,
      values: good,
    });
  });

  it("lists every problem, and survives junk input", () => {
    const result = validateContact({ name: 5, email: "x" }, messages);
    expect(result.ok).toBe(false);
    if (!result.ok)
      expect(Object.keys(result.errors).sort()).toEqual([
        "email",
        "message",
        "name",
        "subject",
      ]);
    expect(validateContact(null, messages).ok).toBe(false);
  });
});

describe("looksLikeBot", () => {
  it("flags a filled honeypot and a too-quick submit", () => {
    expect(looksLikeBot({ website: "http://spam", elapsedMs: 9000 })).toBe(
      "honeypot",
    );
    expect(looksLikeBot({ website: "", elapsedMs: 800 })).toBe("too-fast");
    expect(looksLikeBot({ elapsedMs: undefined })).toBe("too-fast");
    expect(looksLikeBot({ website: "", elapsedMs: 3200 })).toBeNull();
  });
});

describe("whatsapp and phone helpers", () => {
  it("builds wa.me links", () => {
    expect(whatsappHref("+237 676 940 247")).toBe("https://wa.me/237676940247");
    expect(whatsappHref("237676940247", "Hi there")).toBe(
      "https://wa.me/237676940247?text=Hi%20there",
    );
    expect(whatsappHref("abc")).toBeNull();
  });

  it("writes the follow-up message", () => {
    expect(whatsappText(good)).toBe(
      "Hi Chestly, it's Ada. Collaboration: I would like to work with you.",
    );
  });

  it("shows a bare number with a plus", () => {
    expect(displayPhone("237676940247")).toBe("+237676940247");
    expect(displayPhone("+237 676 940 247")).toBe("+237 676 940 247");
  });
});
