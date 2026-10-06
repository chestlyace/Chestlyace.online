// Reordering a filtered list (the Experience tabs): the visible entries swap
// among the places the visible entries already hold, so the hidden ones stay put.
// The server does the same (reorderRows), so what the screen shows is what it saves.
export function mergeSubset<T extends { id: number }>(
  full: readonly T[],
  reordered: readonly T[],
): T[] {
  const visible = new Set(reordered.map((item) => item.id));
  const next = [...full];
  let take = 0;
  for (let i = 0; i < next.length; i++) {
    if (visible.has(next[i].id)) next[i] = reordered[take++];
  }
  return next;
}

// "My Project!" → "my-project": an address from a title.
export function slugify(title: string): string {
  return title
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
}
