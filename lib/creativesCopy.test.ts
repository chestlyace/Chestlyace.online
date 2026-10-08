import { describe, expect, it } from "vitest";
import {
  CREATIVES_DEFAULTS,
  CREATIVES_TEXT_FIELDS,
  withCreativesDefaults,
} from "./creativesCopy";

describe("withCreativesDefaults", () => {
  it("is the built-in wording when nothing is stored", () => {
    expect(withCreativesDefaults(null)).toEqual(CREATIVES_DEFAULTS);
    for (const field of CREATIVES_TEXT_FIELDS)
      expect(CREATIVES_DEFAULTS[field].length).toBeGreaterThan(0);
    expect(CREATIVES_DEFAULTS.marqueeWords.length).toBeGreaterThan(0);
  });

  it("takes what is stored, trimmed, and falls back where it is blank", () => {
    const settings = withCreativesDefaults({
      heroStatement: "  Make & Capture ",
      heroLine: "  ",
      contactNote: null,
      marqueeWords: [" Design ", "", 4, "Photos"],
    });
    expect(settings.heroStatement).toBe("Make & Capture");
    expect(settings.heroLine).toBe(CREATIVES_DEFAULTS.heroLine);
    expect(settings.contactNote).toBe(CREATIVES_DEFAULTS.contactNote);
    expect(settings.marqueeWords).toEqual(["Design", "Photos"]);
    expect(withCreativesDefaults({ marqueeWords: [] }).marqueeWords).toEqual(
      CREATIVES_DEFAULTS.marqueeWords,
    );
  });

  it("never lets a caller change the defaults", () => {
    withCreativesDefaults(null).marqueeWords.push("x");
    expect(CREATIVES_DEFAULTS.marqueeWords).not.toContain("x");
  });
});
