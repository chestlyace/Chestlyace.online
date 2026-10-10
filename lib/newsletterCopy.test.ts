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

describe("withDefaults in French", () => {
  it("is the French built-in wording when nothing is stored", () => {
    expect(withDefaults(null, "fr").boxTitle).toBe(
      "Les nouveaux articles, dans votre boîte mail",
    );
    for (const field of NEWSLETTER_FIELDS)
      expect(withDefaults(null, "fr")[field]).not.toBe(
        NEWSLETTER_DEFAULTS[field],
      );
  });

  it("takes the French the owner wrote, then the built-in French for an English field they left alone, then their English", () => {
    const settings = withDefaults(
      {
        boxTitle: NEWSLETTER_DEFAULTS.boxTitle, // saved with the form, unchanged
        boxText: "My own text",
        boxLabel: "Letters",
        translations: { fr: { boxLabel: "Lettres", boxHelper: "  " } },
      },
      "fr",
    );
    expect(settings.boxLabel).toBe("Lettres");
    expect(settings.boxText).toBe("My own text");
    expect(settings.boxTitle).toBe(
      "Les nouveaux articles, dans votre boîte mail",
    );
    expect(settings.boxHelper).toBe(withDefaults(null, "fr").boxHelper);
  });

  it("leaves English alone, and the switch is shared", () => {
    const stored = {
      boxLabel: "Letters",
      enabled: false,
      translations: { fr: { boxLabel: "Lettres" } },
    };
    expect(withDefaults(stored).boxLabel).toBe("Letters");
    expect(withDefaults(stored, "fr").enabled).toBe(false);
  });
});
