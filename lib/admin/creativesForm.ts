import type { z } from "zod";
import type { AdminRow, Values } from "./config";
import { designPieceSchema, photoEventSchema } from "./schemas";

// The creatives editors' forms (design.md §14.26), apart from React: a database row
// → the form's state, the state → the body the API takes, and the checks that say
// where a problem is. Safe for the browser.

export type Picture = {
  url: string;
  width: number;
  height: number;
  alt: string;
  caption?: string;
  /** The French alt text and caption (docs/i18n.md §5). */
  altFr?: string;
  captionFr?: string;
};
export type Cover = { url: string; width: number; height: number };
export type Credit = {
  role: string;
  name: string;
  url: string;
  /** The French role. */
  roleFr?: string;
};

/** The French of the entry's text fields (plain names, `coverAlt` included). */
export type FrenchValues = Record<string, string | string[]>;

export type PieceForm = {
  fields: Values;
  /** The French version of the text (docs/i18n.md §5), by plain field name. */
  french: FrenchValues;
  cover: Cover | null;
  coverAlt: string;
  images: Picture[];
};

export type EventForm = PieceForm & { credits: Credit[] };

const text = (value: unknown) => (value == null ? "" : String(value));
const list = (value: unknown) => (Array.isArray(value) ? value : []);

const pictures = (value: unknown): Picture[] =>
  list(value).map((item) => {
    const p = item as Partial<Picture>;
    return {
      url: text(p.url),
      width: Number(p.width) || 0,
      height: Number(p.height) || 0,
      alt: text(p.alt),
      ...(p.caption ? { caption: String(p.caption) } : {}),
      ...(p.altFr ? { altFr: String(p.altFr) } : {}),
      ...(p.captionFr ? { captionFr: String(p.captionFr) } : {}),
    };
  });

/** The French values stored on a row (`translations.fr`), text and lists only. */
const frenchOf = (row: AdminRow): FrenchValues => {
  const stored = (row.translations as { fr?: Record<string, unknown> } | null)
    ?.fr;
  const out: FrenchValues = {};
  for (const [name, value] of Object.entries(stored ?? {})) {
    if (Array.isArray(value)) out[name] = value.map(String);
    else if (typeof value === "string") out[name] = value;
  }
  return out;
};

/** What goes in a request's `translations`: the French that was written. */
const translationsOf = (french: FrenchValues) => {
  const fr: FrenchValues = {};
  for (const [name, value] of Object.entries(french)) {
    if (Array.isArray(value)) {
      const items = value.filter((item) => item.trim() !== "");
      if (items.length > 0) fr[name] = items;
    } else if (value.trim() !== "") fr[name] = value;
  }
  return Object.keys(fr).length > 0 ? { fr } : {};
};

const coverOf = (row: AdminRow): Cover | null =>
  row.coverUrl
    ? {
        url: text(row.coverUrl),
        width: Number(row.coverWidth) || 0,
        height: Number(row.coverHeight) || 0,
      }
    : null;

export const emptyPiece = (): PieceForm => ({
  fields: {
    title: "",
    slug: "",
    category: "",
    description: "",
    client: "",
    role: "",
    tools: [],
    year: "",
    linkUrl: "",
    isFeatured: false,
    isPublished: false,
  },
  cover: null,
  coverAlt: "",
  images: [],
  french: {},
});

export const emptyEvent = (): EventForm => ({
  fields: {
    title: "",
    slug: "",
    eventDate: "",
    place: "",
    kind: "",
    description: "",
    role: "",
    covered: [],
    albumUrl: "",
    albumLabel: "",
    isFeatured: false,
    isPublished: false,
  },
  cover: null,
  coverAlt: "",
  images: [],
  french: {},
  credits: [],
});

export function pieceFromRow(row: AdminRow): PieceForm {
  return {
    fields: {
      title: text(row.title),
      slug: text(row.slug),
      category: text(row.category),
      description: text(row.description),
      client: text(row.client),
      role: text(row.role),
      tools: list(row.tools).map(String),
      year: text(row.year),
      linkUrl: text(row.linkUrl),
      isFeatured: row.isFeatured === true,
      isPublished: row.isPublished === true,
    },
    cover: coverOf(row),
    coverAlt: text(row.coverAlt),
    images: pictures(row.images),
    french: frenchOf(row),
  };
}

export function eventFromRow(row: AdminRow): EventForm {
  return {
    fields: {
      title: text(row.title),
      slug: text(row.slug),
      eventDate: text(row.eventDate),
      place: text(row.place),
      kind: text(row.kind),
      description: text(row.description),
      role: text(row.role),
      covered: list(row.covered).map(String),
      albumUrl: text(row.albumUrl),
      albumLabel: text(row.albumLabel),
      isFeatured: row.isFeatured === true,
      isPublished: row.isPublished === true,
    },
    cover: coverOf(row),
    coverAlt: text(row.coverAlt),
    images: pictures(row.images),
    french: frenchOf(row),
    credits: list(row.credits).map((item) => {
      const c = item as Partial<Credit>;
      return {
        role: text(c.role),
        name: text(c.name),
        url: text(c.url),
        ...(c.roleFr ? { roleFr: text(c.roleFr) } : {}),
      };
    }),
  };
}

const coverBody = (form: PieceForm) => ({
  coverUrl: form.cover?.url ?? "",
  coverWidth: form.cover?.width ?? 0,
  coverHeight: form.cover?.height ?? 0,
  coverAlt: form.coverAlt,
});

const picturesBody = (images: Picture[], captions: boolean) =>
  images.map((p) => ({
    url: p.url,
    width: p.width,
    height: p.height,
    alt: p.alt,
    ...(captions && p.caption?.trim() ? { caption: p.caption } : {}),
    ...(p.altFr?.trim() ? { altFr: p.altFr } : {}),
    ...(captions && p.captionFr?.trim() ? { captionFr: p.captionFr } : {}),
  }));

export function pieceBody(form: PieceForm): Record<string, unknown> {
  return {
    ...form.fields,
    ...coverBody(form),
    images: picturesBody(form.images, false),
    translations: translationsOf(form.french),
  };
}

export function eventBody(form: EventForm): Record<string, unknown> {
  return {
    ...form.fields,
    ...coverBody(form),
    images: picturesBody(form.images, true),
    credits: form.credits.map((c) => ({
      role: c.role,
      name: c.name,
      ...(c.url.trim() ? { url: c.url } : {}),
      ...(c.roleFr?.trim() ? { roleFr: c.roleFr } : {}),
    })),
    translations: translationsOf(form.french),
  };
}

// Where a problem shows in the form: the cover's four fields are one place, and a
// problem inside a list says which entry it is.
const place = (path: PropertyKey[]): string => {
  const key = String(path[0] ?? "_");
  return key === "coverUrl" || key === "coverWidth" || key === "coverHeight"
    ? "cover"
    : key === "translations"
      ? "french"
      : key;
};

const LISTS: Record<string, string> = { images: "Picture", credits: "Credit" };

export function problems(
  schema: z.ZodObject,
  body: Record<string, unknown>,
): Record<string, string> {
  const result = schema.safeParse(body);
  if (result.success) return {};
  const found: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = place(issue.path);
    const index = typeof issue.path[1] === "number" ? issue.path[1] + 1 : null;
    const label = LISTS[key];
    if (!(key in found))
      found[key] =
        label && index ? `${label} ${index}: ${issue.message}` : issue.message;
  }
  return found;
}

// The cover is one place with its own words: nothing chosen, or no description.
function withCover(form: PieceForm, found: Record<string, string>) {
  if (!form.cover) found.cover = "Add a cover image.";
  else if (!form.coverAlt.trim()) found.cover = "Describe the cover.";
  return found;
}

export const pieceProblems = (form: PieceForm) =>
  withCover(form, problems(designPieceSchema, pieceBody(form)));
export const eventProblems = (form: EventForm) =>
  withCover(form, problems(photoEventSchema, eventBody(form)));

/** The API's field errors, put where the form shows them. */
export function serverProblems(
  fields: Record<string, string>,
): Record<string, string> {
  const found: Record<string, string> = {};
  for (const [name, message] of Object.entries(fields)) {
    const key = place([name]);
    if (!(key in found)) found[key] = message;
  }
  return found;
}
