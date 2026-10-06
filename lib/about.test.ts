import { describe, expect, it } from "vitest";
import { aboutFacts, splitParagraphs } from "./about";

describe("splitParagraphs", () => {
  it("splits on blank lines", () => {
    expect(splitParagraphs("One.\n\nTwo.\n\n\n\nThree.")).toEqual([
      "One.",
      "Two.",
      "Three.",
    ]);
  });

  it("joins hard-wrapped lines inside a paragraph", () => {
    expect(splitParagraphs("A line\nwrapped here.\n\nNext.")).toEqual([
      "A line wrapped here.",
      "Next.",
    ]);
  });

  it("returns nothing for empty input", () => {
    for (const value of [null, undefined, "", "  \n\n  "]) {
      expect(splitParagraphs(value)).toEqual([]);
    }
  });
});

describe("aboutFacts", () => {
  const profile = {
    location: "Yaoundé, Cameroon",
    headline: "Software Engineer",
    tagline: "Open to Remote Roles",
    availability: "open",
  };

  it("lists location, role, and status", () => {
    expect(aboutFacts(profile)).toEqual([
      { label: "Based in", value: "Yaoundé, Cameroon" },
      { label: "Role", value: "Software Engineer" },
      { label: "Status", value: "Open to Remote Roles" },
    ]);
  });

  it("leaves out rows with nothing to show", () => {
    expect(
      aboutFacts({ ...profile, location: null }).map((f) => f.label),
    ).toEqual(["Role", "Status"]);
    expect(aboutFacts({ ...profile, location: "  " })).toHaveLength(2);
  });

  it("only shows a status while open", () => {
    for (const availability of ["limited", "closed", null]) {
      const facts = aboutFacts({ ...profile, availability });
      expect(facts.map((f) => f.label)).not.toContain("Status");
    }
  });
});
