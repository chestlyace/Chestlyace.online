import { describe, expect, it } from "vitest";
import { heroSrText, imageSource, phoneHref, splitHeadline } from "./hero";

describe("splitHeadline", () => {
  it("splits at the first space", () => {
    expect(splitHeadline("Software Engineer")).toEqual([
      "Software",
      "Engineer",
    ]);
  });

  it("keeps extra words on the second line", () => {
    expect(splitHeadline("Senior Software Engineer")).toEqual([
      "Senior",
      "Software Engineer",
    ]);
  });

  it("returns one line for a single word", () => {
    expect(splitHeadline("Engineer")).toEqual(["Engineer"]);
  });

  it("trims and collapses whitespace", () => {
    expect(splitHeadline("  Software   Engineer \n")).toEqual([
      "Software",
      "Engineer",
    ]);
  });

  it("returns nothing for an empty headline", () => {
    expect(splitHeadline("")).toEqual([]);
    expect(splitHeadline("   ")).toEqual([]);
  });
});

describe("heroSrText", () => {
  it("includes the legal name when it differs", () => {
    expect(
      heroSrText("Chestly Ace", "Amahndong Chestly", "Software Engineer"),
    ).toBe("Chestly Ace, also known as Amahndong Chestly — software engineer");
  });

  it("leaves it out when missing or the same", () => {
    expect(heroSrText("Chestly Ace", null, "Software Engineer")).toBe(
      "Chestly Ace — software engineer",
    );
    expect(heroSrText("Chestly Ace", "Chestly Ace", "Engineer")).toBe(
      "Chestly Ace — engineer",
    );
  });
});

describe("imageSource", () => {
  it("keeps a public path as local", () => {
    expect(imageSource("/hero.webp")).toEqual({
      kind: "local",
      src: "/hero.webp",
    });
  });

  it("serves a bare file name from the site root", () => {
    expect(imageSource("684d5ff7.png")).toEqual({
      kind: "local",
      src: "/684d5ff7.png",
    });
  });

  it("treats full URLs as remote", () => {
    expect(imageSource("https://res.cloudinary.com/x/hero.webp")).toEqual({
      kind: "remote",
      src: "https://res.cloudinary.com/x/hero.webp",
    });
  });

  it("treats a protocol-relative URL as remote, never as a local path", () => {
    expect(imageSource("//evil.example/x.png")).toEqual({
      kind: "remote",
      src: "https://evil.example/x.png",
    });
  });

  it("returns none for empty values", () => {
    for (const value of [null, undefined, "", "   "]) {
      expect(imageSource(value)).toEqual({ kind: "none" });
    }
  });
});

describe("phoneHref", () => {
  it("keeps digits and a leading plus", () => {
    expect(phoneHref("+237 676 940 247")).toBe("tel:+237676940247");
  });

  it("returns null when there are no digits", () => {
    expect(phoneHref("n/a")).toBeNull();
    expect(phoneHref("")).toBeNull();
  });
});
