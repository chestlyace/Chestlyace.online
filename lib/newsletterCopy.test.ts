import { describe, expect, it } from "vitest";
import {
  NEWSLETTER_DEFAULTS,
  NEWSLETTER_FIELDS,
  toCopy,
  withDefaults,
} from "./newsletterCopy";

describe("withDefaults", () => {
  it("is the built-in wording, on, when nothing is stored", () => {
    expect(withDefaults(null)).toEqual(NEWSLETTER_DEFAULTS);
    expect(withDefaults(undefined).enabled).toBe(true);
    for (const field of NEWSLETTER_FIELDS)
      expect(NEWSLETTER_DEFAULTS[field].length).toBeGreaterThan(0);
  });

  it("takes what is stored, trimmed, and falls back where it is blank or missing", () => {
    const settings = withDefaults({
      boxTitle: "  Join in  ",
      boxText: "   ",
      boxHelper: null,
      emailSubject: 7,
      enabled: false,
    });
    expect(settings.boxTitle).toBe("Join in");
    expect(settings.boxText).toBe(NEWSLETTER_DEFAULTS.boxText);
    expect(settings.boxHelper).toBe(NEWSLETTER_DEFAULTS.boxHelper);
    expect(settings.emailSubject).toBe(NEWSLETTER_DEFAULTS.emailSubject);
    expect(settings.enabled).toBe(false);
  });
});

describe("toCopy", () => {
  it("gathers the fields for the box, the pages and the email", () => {
    const copy = toCopy(
      withDefaults({ confirmedTitle: "Welcome", failedLead: "Nope" }),
    );
    expect(copy.enabled).toBe(true);
    expect(copy.confirmed.title).toBe("Welcome");
    expect(copy.failed.lead).toBe("Nope");
    expect(copy.box.label).toBe(NEWSLETTER_DEFAULTS.boxLabel);
    expect(copy.email.expires).toBe(NEWSLETTER_DEFAULTS.emailExpires);
  });
});
