import { describe, expect, it } from "vitest";
import {
  checkFile,
  formatBytes,
  isPdf,
  limitsText,
  nameFromUrl,
} from "./upload";

describe("checkFile", () => {
  it("accepts the right types within 10 MB", () => {
    expect(checkFile({ name: "a.JPG", size: 5000 }, "project")).toBeNull();
    expect(checkFile({ name: "a.jpeg", size: 5000 }, "logo")).toBeNull();
    expect(checkFile({ name: "cv.pdf", size: 5000 }, "resume")).toBeNull();
    expect(checkFile({ name: "a.svg", size: 5000 }, "icon")).toBeNull();
  });

  it("says why not", () => {
    expect(checkFile({ name: "a.gif", size: 5000 }, "project")).toMatch(
      /type isn't allowed.*JPG, PNG, WebP or AVIF/,
    );
    expect(checkFile({ name: "a.svg", size: 5000 }, "badge")).toMatch(
      /isn't allowed/,
    );
    expect(checkFile({ name: "cv.pdf", size: 5000 }, "project")).toMatch(
      /isn't allowed/,
    );
    expect(
      checkFile({ name: "a.png", size: 11 * 1024 * 1024 }, "project"),
    ).toBe("That file is over 10 MB.");
    expect(checkFile({ name: "a.png", size: 0 }, "project")).toBe(
      "That file is empty.",
    );
    expect(checkFile({ name: "noextension", size: 10 }, "project")).toMatch(
      /isn't allowed/,
    );
  });
});

describe("text helpers", () => {
  it("formats sizes, limits and names", () => {
    expect(formatBytes(900)).toBe("900 B");
    expect(formatBytes(2048)).toBe("2 KB");
    expect(formatBytes(1.5 * 1024 * 1024)).toBe("1.5 MB");
    expect(formatBytes(10 * 1024 * 1024)).toBe("10 MB");
    expect(limitsText("project")).toBe("JPG, PNG, WebP or AVIF · up to 10 MB");
    expect(limitsText("resume")).toBe("PDF · up to 10 MB");
    expect(
      nameFromUrl(
        "https://res.cloudinary.com/demo/image/upload/v1/portfolio/a%20b.png?x=1",
      ),
    ).toBe("a b.png");
    expect(nameFromUrl("logos/digimark.jpeg")).toBe("digimark.jpeg");
    expect(isPdf("https://x.test/cv.pdf")).toBe(true);
    expect(isPdf("resume.pdf#page=2")).toBe(true);
    expect(isPdf("a.png")).toBe(false);
  });
});
