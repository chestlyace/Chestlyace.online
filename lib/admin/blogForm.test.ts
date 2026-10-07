import { describe, expect, it } from "vitest";
import {
  EMPTY_DETAILS,
  bodyOf,
  canAutosave,
  changesOf,
  detailProblems,
  snapshotOf,
  type PostSnapshot,
} from "./blogForm";

const row = {
  title: "T",
  slug: "t",
  description: "D",
  content: "C",
  tags: ["a"],
  coverUrl: null,
  coverAlt: null,
  status: "published",
  publishedAt: "2026-10-07T09:30:00Z",
  commentsEnabled: true,
  canonicalUrl: null,
  series: null,
};

describe("blog form", () => {
  it("reads a row into the editor's shape (empty text for nulls, a date)", () => {
    const snap = snapshotOf(row);
    expect(snap.status).toBe("published");
    expect(snap.details).toMatchObject({
      coverUrl: "",
      series: "",
      publishedAt: "2026-10-07",
    });
  });

  it("turns blanks back into null", () => {
    const body = bodyOf(snapshotOf(row));
    expect(body).toMatchObject({
      coverUrl: null,
      series: null,
      canonicalUrl: null,
      publishedAt: "2026-10-07",
    });
  });

  it("sends only what changed", () => {
    const saved = snapshotOf(row);
    const now: PostSnapshot = {
      ...saved,
      content: "C2",
      details: { ...saved.details, tags: ["a", "b"] },
    };
    expect(changesOf(saved, now)).toEqual({ content: "C2", tags: ["a", "b"] });
    expect(changesOf(saved, saved)).toEqual({});
  });

  it("knows what is missing to publish and when a draft can autosave", () => {
    expect(detailProblems(EMPTY_DETAILS).map((p) => p.field)).toEqual([
      "title",
      "description",
    ]);
    expect(
      detailProblems({ ...EMPTY_DETAILS, title: "a", description: "b" }),
    ).toEqual([]);
    expect(canAutosave({ ...EMPTY_DETAILS, title: "A", slug: "a" })).toBe(true);
    expect(canAutosave({ ...EMPTY_DETAILS, title: "A", slug: "A b" })).toBe(
      false,
    );
    expect(canAutosave({ ...EMPTY_DETAILS, slug: "a" })).toBe(false);
  });
});
