// The Graphic design gallery's arithmetic (design.md §13.51–13.53), apart from React:
// the categories and their counts, filtering, how tall a tile is, and which column
// a tile goes in. Pure.

export type GalleryPiece = {
  slug: string;
  category: string;
  year: number | null;
  cover: { width: number; height: number };
};

/** A tile is never a sliver: from 3:4 portrait to 16:10 landscape (§13.51). */
export const RATIO_MIN = 3 / 4;
export const RATIO_MAX = 16 / 10;

export function tileRatio(width: number, height: number): number {
  const ratio = height > 0 ? width / height : 1;
  return Math.min(RATIO_MAX, Math.max(RATIO_MIN, ratio));
}

// "Brand identity" → "brand-identity": a category in an address.
export function categorySlug(category: string): string {
  return category
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export type CategoryCount = { slug: string; name: string; count: number };

/** Each category with its count, the most pieces first, then by name (§13.53). */
export function categoriesOf(pieces: readonly GalleryPiece[]): CategoryCount[] {
  const found = new Map<string, CategoryCount>();
  for (const piece of pieces) {
    const slug = categorySlug(piece.category);
    if (!slug) continue;
    const known = found.get(slug);
    if (known) known.count += 1;
    else found.set(slug, { slug, name: piece.category, count: 1 });
  }
  return [...found.values()].sort(
    (a, b) => b.count - a.count || a.name.localeCompare(b.name),
  );
}

export function filterPieces<T extends GalleryPiece>(
  pieces: readonly T[],
  category: string | null,
): T[] {
  if (!category) return [...pieces];
  return pieces.filter((piece) => categorySlug(piece.category) === category);
}

/** How many columns at a viewport width: 1, 2 from `sm`, 3 from `lg`, 4 from `2xl`. */
export function columnsFor(width: number): number {
  return width >= 1536 ? 4 : width >= 1024 ? 3 : width >= 640 ? 2 : 1;
}

/**
 * Puts each tile in the shortest column as it comes, so the tiles read left to
 * right and the columns end at nearly the same height (§13.51). `ratios` are
 * width / height; returns, per column, the indexes of its tiles in order.
 */
export function assignColumns(
  ratios: readonly number[],
  columns: number,
): number[][] {
  const count = Math.max(1, Math.floor(columns));
  const result: number[][] = Array.from({ length: count }, () => []);
  const heights = new Array<number>(count).fill(0);
  ratios.forEach((ratio, index) => {
    let shortest = 0;
    for (let c = 1; c < count; c++)
      if (heights[c] < heights[shortest] - 1e-9) shortest = c;
    result[shortest].push(index);
    heights[shortest] += 1 / (ratio > 0 ? ratio : 1);
  });
  return result;
}
