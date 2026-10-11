import { describe, expect, it } from "vitest";
import {
  GALLERY_RATIO_MAX,
  GALLERY_RATIO_MIN,
  caseStudyRows,
  galleryImages,
  galleryRatio,
  galleryUrls,
  projectLinks,
} from "./projectPage";

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

describe("galleryImages", () => {
  const sizes = {
    "a.png": { width: 800, height: 600 },
    "zero.png": { width: 0, height: 5 },
  };

  it("gives each picture its stored size, in order, and null when it has none", () => {
    expect(galleryImages([" a.png ", "", "b.png", "zero.png"], sizes)).toEqual([
      { url: "a.png", width: 800, height: 600 },
      { url: "b.png", width: null, height: null },
      { url: "zero.png", width: null, height: null },
    ]);
  });

  it("copes with no sizes at all", () => {
    expect(galleryImages(["a.png"], null)).toEqual([
      { url: "a.png", width: null, height: null },
    ]);
    expect(galleryImages(["a.png"], undefined)[0].width).toBeNull();
  });
});

describe("galleryRatio", () => {
  it("is the picture's own shape, kept between 2:5 and 5:2", () => {
    expect(galleryRatio(1600, 900)).toBeCloseTo(16 / 9);
    expect(galleryRatio(800, 1200)).toBeCloseTo(2 / 3);
    expect(galleryRatio(400, 4000)).toBe(GALLERY_RATIO_MIN);
    expect(galleryRatio(4000, 400)).toBe(GALLERY_RATIO_MAX);
    expect(galleryRatio(10, 0)).toBe(1);
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
