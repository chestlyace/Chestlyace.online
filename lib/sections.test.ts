import { describe, expect, it } from "vitest";
import {
  HOME_SECTION_IDS,
  MAIN_NAV,
  activeNavLink,
  sectionBands,
  sectionNumbers,
} from "./sections";

describe("sectionNumbers", () => {
  it("numbers shown sections from 01", () => {
    expect(sectionNumbers(["about", "skills", "contact"])).toEqual({
      about: "01",
      skills: "02",
      contact: "03",
    });
  });

  it("leaves no gap when a section is hidden", () => {
    const shown = HOME_SECTION_IDS.filter((id) => id !== "volunteering");
    const numbers = sectionNumbers(shown);
    expect(numbers.experience).toBe("05");
    expect(numbers.contact).toBe("06");
    expect(numbers.faq).toBe("07");
  });
});

describe("sectionBands", () => {
  it("makes the last section the default band and alternates upward", () => {
    const bands = sectionBands(HOME_SECTION_IDS);
    expect(bands).toEqual({
      about: "alt",
      skills: "default",
      services: "alt",
      projects: "default",
      experience: "alt",
      volunteering: "default",
      contact: "alt",
      faq: "default",
    });
  });

  it("never gives neighbours the same band, even with a section hidden", () => {
    const shown = HOME_SECTION_IDS.filter((id) => id !== "volunteering");
    const bands = sectionBands(shown);
    expect(bands.faq).toBe("default");
    shown.slice(1).forEach((id, index) => {
      expect(bands[id]).not.toBe(bands[shown[index]]);
    });
  });

  it("handles a single section", () => {
    expect(sectionBands(["faq"])).toEqual({ faq: "default" });
  });
});

describe("activeNavLink", () => {
  it("maps each nav link's own section to itself", () => {
    for (const link of MAIN_NAV) {
      expect(activeNavLink(link.id)).toBe(link.id);
    }
  });

  it("keeps the previous link active for sections without a link", () => {
    expect(activeNavLink("skills")).toBe("about");
    expect(activeNavLink("services")).toBe("about");
    expect(activeNavLink("volunteering")).toBe("experience");
    expect(activeNavLink("faq")).toBe("contact");
  });

  it("returns null above the first section and for unknown ids", () => {
    expect(activeNavLink(null)).toBeNull();
    expect(activeNavLink("nope")).toBeNull();
    expect(activeNavLink("toString")).toBeNull();
  });
});
