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

// The home page shows the first few projects (featured first, then the owner's order,
// which is how they arrive); the rest are on the Projects page.
export const HOME_PROJECT_COUNT = 2;

export function homeProjects<T>(projects: readonly T[]): T[] {
  return projects.slice(0, HOME_PROJECT_COUNT);
}
