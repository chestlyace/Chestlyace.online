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
export function caseStudyRows(project: CaseStudy): CaseRow[] {
  const rows: CaseRow[] = [];
  const entries: [string, string | null][] = [
    ["Problem", project.problem],
    ["Approach", project.approach],
    ["Outcome", project.outcome],
  ];
  for (const [label, text] of entries) {
    const value = clean(text);
    if (value) rows.push({ label, text: value });
  }
  if (rows.length > 0) return rows;

  const description = clean(project.description);
  return description ? [{ label: "Overview", text: description }] : [];
}

// Gallery addresses worth showing: not blank.
export function galleryUrls(urls: readonly string[]): string[] {
  return urls.map((url) => url.trim()).filter(Boolean);
}

// Which of a project's links are shown as buttons and which as a "Private" tag.
export function projectLinks(project: {
  liveUrl: string | null;
  sourceUrl: string | null;
  isLiveUrlPrivate: boolean;
  isSourceUrlPrivate: boolean;
}) {
  const make = (url: string | null, isPrivate: boolean, label: string) => {
    if (isPrivate) return { label, kind: "private" as const };
    if (url) return { label, kind: "link" as const, href: url };
    return null;
  };
  return [
    make(project.liveUrl, project.isLiveUrlPrivate, "Live"),
    make(project.sourceUrl, project.isSourceUrlPrivate, "Source"),
  ].filter((link) => link !== null);
}
