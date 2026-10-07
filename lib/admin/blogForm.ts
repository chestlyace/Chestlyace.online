// What the blog editor keeps for a post and how it becomes an API request
// (design.md §13.48). Safe for the browser: no database in here.

export type PostDetails = {
  title: string;
  slug: string;
  description: string;
  tags: string[];
  coverUrl: string;
  coverAlt: string;
  /** A date, `2026-10-07`, or empty. */
  publishedAt: string;
  commentsEnabled: boolean;
  canonicalUrl: string;
  series: string;
};

export type PostStatus = "draft" | "published";

export type PostSnapshot = {
  details: PostDetails;
  content: string;
  status: PostStatus;
};

export const EMPTY_DETAILS: PostDetails = {
  title: "",
  slug: "",
  description: "",
  tags: [],
  coverUrl: "",
  coverAlt: "",
  publishedAt: "",
  commentsEnabled: true,
  canonicalUrl: "",
  series: "",
};

type Row = {
  title: string;
  slug: string;
  description: string;
  content: string;
  tags: string[];
  coverUrl: string | null;
  coverAlt: string | null;
  status: string;
  publishedAt: string | Date | null;
  commentsEnabled: boolean;
  canonicalUrl: string | null;
  series: string | null;
};

export function snapshotOf(row: Row): PostSnapshot {
  const published = row.publishedAt
    ? new Date(row.publishedAt).toISOString().slice(0, 10)
    : "";
  return {
    details: {
      title: row.title,
      slug: row.slug,
      description: row.description,
      tags: row.tags,
      coverUrl: row.coverUrl ?? "",
      coverAlt: row.coverAlt ?? "",
      publishedAt: published,
      commentsEnabled: row.commentsEnabled,
      canonicalUrl: row.canonicalUrl ?? "",
      series: row.series ?? "",
    },
    content: row.content,
    status: row.status === "published" ? "published" : "draft",
  };
}

const blankToNull = (value: string) => (value.trim() === "" ? null : value);

// The request body for everything the editor holds.
export function bodyOf(snapshot: PostSnapshot): Record<string, unknown> {
  const { details } = snapshot;
  return {
    title: details.title,
    slug: details.slug,
    description: details.description,
    tags: details.tags,
    coverUrl: blankToNull(details.coverUrl),
    coverAlt: blankToNull(details.coverAlt),
    publishedAt: blankToNull(details.publishedAt),
    commentsEnabled: details.commentsEnabled,
    canonicalUrl: blankToNull(details.canonicalUrl),
    series: blankToNull(details.series),
    content: snapshot.content,
    status: snapshot.status,
  };
}

// Editing an existing post sends only what changed.
export function changesOf(
  saved: PostSnapshot,
  now: PostSnapshot,
): Record<string, unknown> {
  const before = bodyOf(saved);
  const after = bodyOf(now);
  return Object.fromEntries(
    Object.entries(after).filter(
      ([key, value]) => JSON.stringify(value) !== JSON.stringify(before[key]),
    ),
  );
}

export const sameSnapshot = (a: PostSnapshot, b: PostSnapshot) =>
  JSON.stringify(a) === JSON.stringify(b);

// What stops a post from being published, as far as the details go.
export function detailProblems(
  details: PostDetails,
): { field: "title" | "description"; message: string }[] {
  const problems: { field: "title" | "description"; message: string }[] = [];
  if (!details.title.trim())
    problems.push({ field: "title", message: "Add a title." });
  if (!details.description.trim())
    problems.push({ field: "description", message: "Add a description." });
  return problems;
}

// A draft can be saved by itself once it has a title and a valid address.
export const canAutosave = (details: PostDetails) =>
  details.title.trim() !== "" && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(details.slug);
