// Layout rules for the Projects grid (design.md §14.5).

// Featured projects get a full-width row first; the rest fill two columns, and
// every second one — the right-hand column — is pushed down 96px so the tiles
// step down the page. Returns, per project, whether it is in that offset column.
export function rightColumnFlags(featured: readonly boolean[]): boolean[] {
  let position = 0;
  return featured.map((isFeatured) => {
    if (isFeatured) return false;
    const right = position % 2 === 1;
    position++;
    return right;
  });
}
