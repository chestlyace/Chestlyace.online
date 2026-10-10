// What the page-navigation feedback listens to (design.md §13.64): links report when
// their navigation starts and ends, this counts them and says in which phase the bar
// is. A tiny external store (no React state), read with `useSyncExternalStore`.

export type LoadingPhase = "idle" | "loading" | "done";

let pending = 0;
let phase: LoadingPhase = "idle";
let timer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();

/** How long the bar stays on screen, completing and fading, after the page arrives. */
export const DONE_MS = 300;

function set(next: LoadingPhase) {
  if (phase === next) return;
  phase = next;
  for (const listener of listeners) listener();
}

/** A navigation started. */
export function startLoading() {
  pending += 1;
  clearTimeout(timer);
  set("loading");
}

/** A navigation ended (the page arrived, or the click was abandoned). */
export function stopLoading() {
  pending = Math.max(0, pending - 1);
  if (pending > 0) return;
  set("done");
  clearTimeout(timer);
  timer = setTimeout(() => {
    if (pending === 0) set("idle");
  }, DONE_MS);
}

export function subscribeLoading(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export const getLoadingPhase = (): LoadingPhase => phase;

/** For tests: back to the start. */
export function resetLoading() {
  pending = 0;
  clearTimeout(timer);
  phase = "idle";
  listeners.clear();
}
