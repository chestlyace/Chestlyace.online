// The shared element between an event tile and the event page's hero (design.md
// §13.54): the tile hands its cover's rectangle over when it is clicked, and the hero
// grows out of it once it has mounted. The hand-over lives in sessionStorage, which
// survives the client navigation and is gone on a reload or a direct visit.
const KEY = "creatives:event-flight";
const MAX_AGE = 4000;

type Flight = {
  slug: string;
  at: number;
  rect: { left: number; top: number; width: number; height: number };
};

export function rememberTile(slug: string, link: HTMLElement) {
  const cover = link.querySelector<HTMLElement>("[data-event-cover]");
  if (!cover) return;
  const { left, top, width, height } = cover.getBoundingClientRect();
  try {
    const flight: Flight = {
      slug,
      at: Date.now(),
      rect: { left, top, width, height },
    };
    sessionStorage.setItem(KEY, JSON.stringify(flight));
  } catch {
    // No storage: the hero simply fades in.
  }
}

/** The tile rectangle left for this event a moment ago, once. */
export function takeFlight(slug: string): Flight["rect"] | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    if (!raw) return null;
    const flight = JSON.parse(raw) as Flight;
    if (flight.slug !== slug || Date.now() - flight.at > MAX_AGE) return null;
    return flight.rect;
  } catch {
    return null;
  }
}
