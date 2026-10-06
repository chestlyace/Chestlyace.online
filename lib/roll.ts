// Text roll (design.md §13.3): each letter rolls 300ms, staggered 15ms, with
// the whole word capped at 450ms — longer labels shorten the stagger.

const MAX_STAGGER_MS = 15;
const MAX_EXTRA_MS = 150; // 450ms total − 300ms per letter

export function rollChars(text: string): string[] {
  return Array.from(text);
}

export function rollStaggerMs(length: number): number {
  if (length <= 1) return MAX_STAGGER_MS;
  return Math.min(MAX_STAGGER_MS, MAX_EXTRA_MS / (length - 1));
}
