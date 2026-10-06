// The experience "wheel" (design.md §13.13): a vertical list that scrolls past a
// fixed spotlight like a date picker. These are the numbers behind it; the
// component only applies them.

// A little of the scroll distance is spent on the first and last entry, so each
// one is held in the spotlight before the wheel starts and after it ends.
const DWELL = 0.08;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

// Scroll progress through the pinned track (0–1) → a position on the list:
// 0 is the first entry, `count - 1` the last, fractions are in between.
export function progressToIndex(progress: number, count: number): number {
  if (count <= 1) return 0;
  const t = clamp((progress - DWELL) / (1 - 2 * DWELL), 0, 1);
  return t * (count - 1);
}

// …and back: the scroll progress at which entry `index` sits in the spotlight.
export function indexToProgress(index: number, count: number): number {
  if (count <= 1) return 0;
  return DWELL + (1 - 2 * DWELL) * (clamp(index, 0, count - 1) / (count - 1));
}

// The entry in the spotlight.
export function activeEntry(position: number, count: number): number {
  return clamp(Math.round(position), 0, Math.max(count - 1, 0));
}

// How an entry looks at `distance` rows from the spotlight: full size and colour
// in it, smaller and fainter the further away.
export function wheelLook(distance: number): {
  opacity: number;
  scale: number;
} {
  const away = Math.min(Math.abs(distance), 2);
  return {
    opacity: Math.max(0.15, 1 - 0.6 * Math.min(away, 1.5)),
    scale: 1 - 0.1 * away,
  };
}
