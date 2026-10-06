import { describe, expect, it } from "vitest";
import { caseStudyRows, galleryUrls, projectLinks } from "./projectPage";

const base = {
  problem: null,
  approach: null,
  outcome: null,
  description: null,
};

describe("caseStudyRows", () => {
  it("shows only the sections that have text, in order", () => {
    expect(
      caseStudyRows({
        ...base,
        problem: " Slow ",
        outcome: "Fast",
        description: "x",
      }),
    ).toEqual([
      { label: "Problem", text: "Slow" },
      { label: "Outcome", text: "Fast" },
    ]);
  });

  it("falls back to the description when all three are empty", () => {
    expect(
      caseStudyRows({ ...base, problem: "  ", description: "About it" }),
    ).toEqual([{ label: "Overview", text: "About it" }]);
  });

  it("is empty when there is nothing to say", () => {
    expect(caseStudyRows(base)).toEqual([]);
  });
});

describe("galleryUrls", () => {
  it("drops blanks", () => {
    expect(galleryUrls(["a.png", " ", "", " b.png "])).toEqual([
      "a.png",
      "b.png",
    ]);
  });
});

describe("projectLinks", () => {
  it("makes buttons for public links and tags for private ones", () => {
    expect(
      projectLinks({
        liveUrl: "https://x.dev",
        sourceUrl: "https://git/x",
        isLiveUrlPrivate: false,
        isSourceUrlPrivate: true,
      }),
    ).toEqual([
      { label: "Live", kind: "link", href: "https://x.dev" },
      { label: "Source", kind: "private" },
    ]);
  });

  it("leaves out links that don't exist", () => {
    expect(
      projectLinks({
        liveUrl: null,
        sourceUrl: null,
        isLiveUrlPrivate: false,
        isSourceUrlPrivate: false,
      }),
    ).toEqual([]);
  });
});
