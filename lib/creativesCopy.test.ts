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

describe("withCreativesDefaults in French", () => {
  it("is the French built-in wording when nothing is stored", () => {
    const settings = withCreativesDefaults(null, "fr");
    expect(settings.heroStatement).toBe("Design & Photographie");
    expect(settings.marqueeWords).toEqual([
      "Design graphique",
      "Photographie",
      "Identité visuelle",
      "Événements",
    ]);
    for (const field of CREATIVES_TEXT_FIELDS)
      expect(settings[field]).not.toBe(CREATIVES_DEFAULTS[field]);
  });

  it("takes the owner's French, then the built-in French for an English field left alone, then their English", () => {
    const settings = withCreativesDefaults(
      {
        heroStatement: CREATIVES_DEFAULTS.heroStatement, // saved by the form, unchanged
        heroLine: "My own line",
        designIntro: "My design intro",
        marqueeWords: [...CREATIVES_DEFAULTS.marqueeWords],
        translations: {
          fr: { designIntro: "Mon intro", contactNote: "  " },
        },
      },
      "fr",
    );
    expect(settings.designIntro).toBe("Mon intro");
    expect(settings.heroLine).toBe("My own line");
    expect(settings.heroStatement).toBe("Design & Photographie");
    expect(settings.contactNote).toBe(
      withCreativesDefaults(null, "fr").contactNote,
    );
    expect(settings.marqueeWords).toEqual(
      withCreativesDefaults(null, "fr").marqueeWords,
    );
  });

  it("uses the French marquee words, else the owner's English ones", () => {
    const own = ["Brand", "Event"];
    expect(
      withCreativesDefaults({ marqueeWords: own }, "fr").marqueeWords,
    ).toEqual(own);
    expect(
      withCreativesDefaults(
        {
          marqueeWords: own,
          translations: { fr: { marqueeWords: ["Marque"] } },
        },
        "fr",
      ).marqueeWords,
    ).toEqual(["Marque"]);
  });

  it("leaves English alone and never lets a caller change the French defaults", () => {
    expect(
      withCreativesDefaults(
        { heroLine: "Mine", translations: { fr: { heroLine: "À moi" } } },
        "en",
      ).heroLine,
    ).toBe("Mine");
    withCreativesDefaults(null, "fr").marqueeWords.push("x");
    expect(withCreativesDefaults(null, "fr").marqueeWords).not.toContain("x");
  });
});
