import { describe, expect, it } from "vitest";
import {
  assignColumns,
  categoriesOf,
  categorySlug,
  columnsFor,
  filterPieces,
  tileRatio,
  type GalleryPiece,
} from "./gallery";

const piece = (slug: string, category: string): GalleryPiece => ({
  slug,
  category,
  year: 2026,
  cover: { width: 100, height: 100 },
});

describe("tileRatio", () => {
  it("keeps a normal ratio and clamps slivers", () => {
    expect(tileRatio(1200, 800)).toBeCloseTo(1.5);
    expect(tileRatio(500, 2000)).toBe(3 / 4);
    expect(tileRatio(4000, 500)).toBe(16 / 10);
    expect(tileRatio(100, 0)).toBe(1);
  });
});

describe("categories", () => {
  it("slugs a category", () => {
    expect(categorySlug("Brand identity")).toBe("brand-identity");
    expect(categorySlug("Posters & Flyers")).toBe("posters-and-flyers");
    expect(categorySlug("  ")).toBe("");
  });

  it("counts them, most pieces first, then by name; the same category in another case is one", () => {
    const pieces = [
      piece("a", "Poster"),
      piece("b", "Brand identity"),
      piece("c", "poster"),
      piece("d", "Social"),
      piece("e", "Brand identity"),
      piece("f", ""),
    ];
    expect(categoriesOf(pieces)).toEqual(
      [
        { slug: "poster", name: "Poster", count: 2 },
        { slug: "brand-identity", name: "Brand identity", count: 2 },
        { slug: "social", name: "Social", count: 1 },
      ].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
    );
  });

  it("filters by a category slug, or keeps all", () => {
    const pieces = [
      piece("a", "Poster"),
      piece("b", "Social"),
      piece("c", "Poster"),
    ];
    expect(filterPieces(pieces, "poster").map((p) => p.slug)).toEqual([
      "a",
      "c",
    ]);
    expect(filterPieces(pieces, null)).toHaveLength(3);
    expect(filterPieces(pieces, "nope")).toEqual([]);
  });
});

describe("columns", () => {
  it("is 1, 2, 3 or 4 by width", () => {
    expect(
      [320, 639, 640, 1023, 1024, 1535, 1536, 2000].map(columnsFor),
    ).toEqual([1, 1, 2, 2, 3, 3, 4, 4]);
  });

  it("puts each tile in the shortest column, left to right", () => {
    // ratios: tall (0.75), wide (1.5), square, square...
    const columns = assignColumns([0.75, 1.5, 1, 1, 1, 1], 3);
    expect(columns[0]).toEqual([0, 5]);
    expect(columns[1]).toEqual([1, 3]);
    expect(columns[2]).toEqual([2, 4]);
  });

  it("uses one column for one, and every tile exactly once", () => {
    expect(assignColumns([1, 1, 1], 1)).toEqual([[0, 1, 2]]);
    const all = assignColumns(
      Array.from({ length: 11 }, (_, i) => 0.8 + (i % 3) * 0.3),
      4,
    );
    expect(all.flat().sort((a, b) => a - b)).toEqual(
      Array.from({ length: 11 }, (_, i) => i),
    );
    expect(assignColumns([], 3)).toEqual([[], [], []]);
  });
});
