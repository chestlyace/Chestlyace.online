import { describe, expect, it } from "vitest";
import {
  emptyEvent,
  emptyPiece,
  eventBody,
  eventFromRow,
  eventProblems,
  pieceBody,
  pieceFromRow,
  pieceProblems,
  serverProblems,
} from "./creativesForm";

const cover = {
  url: "https://res.cloudinary.com/x/image/upload/c.webp",
  width: 2400,
  height: 1600,
};
const pic = (n: number, extra: object = {}) => ({
  url: `https://res.cloudinary.com/x/image/upload/p${n}.webp`,
  width: 1200,
  height: 800,
  alt: `Picture ${n}`,
  ...extra,
});

describe("a design piece's form", () => {
  const row = {
    id: 3,
    title: "Acme",
    slug: "acme",
    category: "Brand identity",
    coverUrl: cover.url,
    coverWidth: 2400,
    coverHeight: 1600,
    coverAlt: "A card",
    images: [pic(1)],
    description: null,
    client: "Acme",
    role: null,
    tools: ["Figma"],
    year: 2026,
    linkUrl: null,
    isFeatured: true,
    isPublished: false,
  };

  it("reads a row, blanks for what is missing, and writes the same body back", () => {
    const form = pieceFromRow(row);
    expect(form.fields).toMatchObject({
      title: "Acme",
      description: "",
      year: "2026",
      tools: ["Figma"],
      isFeatured: true,
    });
    expect(form.cover).toEqual(cover);
    const body = pieceBody(form);
    expect(body).toMatchObject({
      coverUrl: cover.url,
      coverWidth: 2400,
      coverAlt: "A card",
      year: "2026",
    });
    expect(pieceProblems(form)).toEqual({});
  });

  it("says where the problems are: the cover as one place, a picture by its number", () => {
    const form = pieceFromRow(row);
    form.cover = null;
    form.images = [pic(1), pic(2, { alt: "" })];
    form.fields.title = "";
    form.fields.slug = "Bad Slug";
    const found = pieceProblems(form);
    expect(Object.keys(found).sort()).toEqual([
      "cover",
      "images",
      "slug",
      "title",
    ]);
    expect(found.images).toMatch(/^Picture 2: /);
  });

  it("starts empty and unpublished", () => {
    const form = emptyPiece();
    expect(form.fields.isPublished).toBe(false);
    expect(pieceProblems(form)).toMatchObject({
      title: expect.any(String),
      cover: expect.any(String),
    });
  });
});

describe("an event's form", () => {
  const row = {
    id: 1,
    title: "PyCon",
    slug: "pycon",
    eventDate: "2026-05-16",
    place: "Yaoundé",
    kind: null,
    coverUrl: cover.url,
    coverWidth: 2400,
    coverHeight: 1600,
    coverAlt: "The crowd",
    description: null,
    role: "Photographer",
    covered: ["Photography"],
    images: [pic(1, { caption: "Opening" }), pic(2)],
    credits: [
      { role: "Photography", name: "Chestly" },
      { role: "Organiser", name: "PyCon", url: "https://x.example" },
    ],
    albumUrl: "https://photos.google.com/a",
    albumLabel: "Google Photos",
    isFeatured: false,
    isPublished: true,
  };

  it("keeps captions, drops empty ones and empty credit links", () => {
    const form = eventFromRow(row);
    expect(form.credits[0]).toEqual({
      role: "Photography",
      name: "Chestly",
      url: "",
    });
    form.images[1].caption = "  ";
    const body = eventBody(form) as { images: object[]; credits: object[] };
    expect(body.images[0]).toMatchObject({ caption: "Opening" });
    expect(body.images[1]).not.toHaveProperty("caption");
    expect(body.credits[0]).toEqual({ role: "Photography", name: "Chestly" });
    expect(body.credits[1]).toMatchObject({ url: "https://x.example" });
    expect(eventProblems(form)).toEqual({});
  });

  it("flags a credit with no name and an album that isn't https", () => {
    const form = eventFromRow(row);
    form.credits.push({ role: "Editing", name: "", url: "" });
    form.fields.albumUrl = "http://insecure.example";
    const found = eventProblems(form);
    expect(found.credits).toMatch(/^Credit 3: /);
    expect(found.albumUrl).toBeTruthy();
    expect(emptyEvent().credits).toEqual([]);
  });
});

describe("serverProblems", () => {
  it("maps the cover's fields to one place", () => {
    expect(
      serverProblems({
        coverWidth: "The width is missing.",
        coverUrl: "x",
        slug: "Taken.",
      }),
    ).toEqual({ cover: "The width is missing.", slug: "Taken." });
  });
});
