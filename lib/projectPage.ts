// What the project page shows (design.md §14.10), worked out from the row.

type CaseStudy = {
  problem: string | null;
  approach: string | null;
  outcome: string | null;
  description: string | null;
};

export type CaseRow = { label: string; text: string };

const clean = (text: string | null) => text?.trim() || null;

// Problem / Approach / Outcome rows, each shown only when it has text. When all
// three are empty the page shows the description instead, as one row.
export function caseStudyRows(
  project: CaseStudy,
  labels = {
    problem: "Problem",
    approach: "Approach",
    outcome: "Outcome",
    overview: "Overview",
  },
): CaseRow[] {
  const rows: CaseRow[] = [];
  const entries: [string, string | null][] = [
    [labels.problem, project.problem],
    [labels.approach, project.approach],
    [labels.outcome, project.outcome],
  ];
  for (const [label, text] of entries) {
    const value = clean(text);
    if (value) rows.push({ label, text: value });
  }
  if (rows.length > 0) return rows;

  const description = clean(project.description);
  return description ? [{ label: labels.overview, text: description }] : [];
}

// Gallery addresses worth showing: not blank.
export function galleryUrls(urls: readonly string[]): string[] {
  return urls.map((url) => url.trim()).filter(Boolean);
}

export type GalleryImage = {
  url: string;
  /** The picture's size, when it was learned at save time (`projects.gallery_sizes`). */
  width: number | null;
  height: number | null;
};

// The gallery's pictures in order, each with its size when it is known.
export function galleryImages(
  urls: readonly string[],
  sizes:
    | Readonly<Record<string, { width: number; height: number }>>
    | null
    | undefined,
): GalleryImage[] {
  return galleryUrls(urls).map((url) => {
    const size = sizes?.[url];
    return size && size.width > 0 && size.height > 0
      ? { url, width: size.width, height: size.height }
      : { url, width: null, height: null };
  });
}

/**
 * A gallery tile's shape: the picture's own width / height, kept between 2:5 (a very
 * tall page) and 5:2 (a very wide one) so no tile is a sliver. Wider limits than the
 * Creatives gallery's, because project pictures are often whole-page screenshots.
 */
export const GALLERY_RATIO_MIN = 0.4;
export const GALLERY_RATIO_MAX = 2.5;

export function galleryRatio(width: number, height: number): number {
  const ratio = height > 0 ? width / height : 1;
  return Math.min(GALLERY_RATIO_MAX, Math.max(GALLERY_RATIO_MIN, ratio));
}

// Which of a project's links are shown as buttons and which as a "Private" tag.
export function projectLinks(
  project: {
    liveUrl: string | null;
    sourceUrl: string | null;
    isLiveUrlPrivate: boolean;
    isSourceUrlPrivate: boolean;
  },
  labels = { live: "Live", source: "Source" },
) {
  const make = (url: string | null, isPrivate: boolean, label: string) => {
    if (isPrivate) return { label, kind: "private" as const };
    if (url) return { label, kind: "link" as const, href: url };
    return null;
  };
  return [
    make(project.liveUrl, project.isLiveUrlPrivate, labels.live),
    make(project.sourceUrl, project.isSourceUrlPrivate, labels.source),
  ].filter((link) => link !== null);
}
