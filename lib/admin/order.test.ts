import { describe, expect, it } from "vitest";
import { mergeSubset, slugify } from "./order";

const rows = (...ids: number[]) => ids.map((id) => ({ id }));

describe("mergeSubset", () => {
  it("puts the reordered entries into the places the visible ones held", () => {
    // 1 and 3 are visible (work), 2 and 4 hidden; 3 now comes before 1
    expect(mergeSubset(rows(1, 2, 3, 4), rows(3, 1)).map((r) => r.id)).toEqual([
      3, 2, 1, 4,
    ]);
  });

  it("is the whole list when nothing is hidden", () => {
    expect(mergeSubset(rows(1, 2, 3), rows(3, 2, 1)).map((r) => r.id)).toEqual([
      3, 2, 1,
    ]);
  });

  it("leaves things alone with nothing visible", () => {
    expect(mergeSubset(rows(1, 2), []).map((r) => r.id)).toEqual([1, 2]);
  });
});

describe("slugify", () => {
  it.each([
    ["Alexdy", "alexdy"],
    ["Lens & Life", "lens-and-life"],
    ["  My Project!! v2  ", "my-project-v2"],
    ["Café Ünïcode", "cafe-unicode"],
    ["---", ""],
    ["a".repeat(80), "a".repeat(60)],
  ])("%j → %j", (title, slug) => {
    expect(slugify(title)).toBe(slug);
  });
});
