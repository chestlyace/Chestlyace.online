import { and, arrayContains, asc, desc, eq } from "drizzle-orm";
import * as schema from "@/db/schema";
import type { Database } from "@/lib/db";
import type { Lang } from "@/lib/i18n";
import { localize, localizeSiblings } from "@/lib/i18n/localize";
import {
  withCreativesDefaults,
  type CreativesSettings,
} from "@/lib/creativesCopy";

// Public reads of the creatives site (docs/content-schema.md §5). Results are
// cached as JSON (lib/creatives/cache.ts), so they hold only plain values.
const {
  designPieces,
  photoEvents,
  creativeServices,
  creativeFaqs,
  creativesSettings,
  socials,
} = schema;

export type PublicImage = {
  url: string;
  width: number;
  height: number;
  alt: string;
};

const PIECE_FIELDS = [
  "title",
  "category",
  "coverAlt",
  "description",
  "client",
  "role",
] as const;

const EVENT_FIELDS = [
  "title",
  "place",
  "kind",
  "coverAlt",
  "description",
  "role",
  "covered",
] as const;

export type PublicPiece = {
  slug: string;
  title: string;
  category: string;
  cover: PublicImage;
  /** More images, after the cover. */
  images: PublicImage[];
  description: string | null;
  client: string | null;
  role: string | null;
  tools: string[];
  year: number | null;
  linkUrl: string | null;
  isFeatured: boolean;
};

// Every published design piece, in the order set in the admin.
export async function listPublishedPieces(
  db: Database,
  lang: Lang = "en",
): Promise<PublicPiece[]> {
  const rows = await db
    .select()
    .from(designPieces)
    .where(eq(designPieces.isPublished, true))
    .orderBy(asc(designPieces.orderIndex), asc(designPieces.id));
  return rows.map((english) => {
    const row = localize(english, lang, PIECE_FIELDS);
    return {
      slug: row.slug,
      title: row.title,
      category: row.category,
      cover: {
        url: row.coverUrl,
        width: row.coverWidth,
        height: row.coverHeight,
        alt: row.coverAlt,
      },
      images: localizeSiblings(row.images, lang, ["alt"]).map((image) => ({
        url: image.url,
        width: image.width,
        height: image.height,
        alt: image.alt,
      })),
      description: row.description,
      client: row.client,
      role: row.role,
      tools: row.tools,
      year: row.year,
      linkUrl: row.linkUrl,
      isFeatured: row.isFeatured,
    };
  });
}

export type PublicEvent = {
  slug: string;
  title: string;
  /** ISO date, "2026-03-14". */
  eventDate: string;
  place: string | null;
  kind: string | null;
  cover: PublicImage;
  description: string | null;
  role: string | null;
  covered: string[];
  images: (PublicImage & { caption: string | null })[];
  credits: { role: string; name: string; url: string | null }[];
  albumUrl: string | null;
  albumLabel: string | null;
  isFeatured: boolean;
};

// Every published event, in the order set in the admin (newest first among equals),
// with the featured event first (design.md §14.22).
export async function listPublishedEvents(
  db: Database,
  lang: Lang = "en",
): Promise<PublicEvent[]> {
  const rows = await db
    .select()
    .from(photoEvents)
    .where(eq(photoEvents.isPublished, true))
    .orderBy(
      asc(photoEvents.orderIndex),
      desc(photoEvents.eventDate),
      asc(photoEvents.id),
    );
  const events = rows.map((english): PublicEvent => {
    const row = localize(english, lang, EVENT_FIELDS);
    return {
      slug: row.slug,
      title: row.title,
      eventDate: row.eventDate,
      place: row.place,
      kind: row.kind,
      cover: {
        url: row.coverUrl,
        width: row.coverWidth,
        height: row.coverHeight,
        alt: row.coverAlt,
      },
      description: row.description,
      role: row.role,
      covered: row.covered,
      images: localizeSiblings(row.images, lang, ["alt", "caption"]).map(
        (image) => ({
          url: image.url,
          width: image.width,
          height: image.height,
          alt: image.alt,
          caption: image.caption ?? null,
        }),
      ),
      credits: localizeSiblings(row.credits, lang, ["role"]).map((credit) => ({
        role: credit.role,
        name: credit.name,
        url: credit.url ?? null,
      })),
      albumUrl: row.albumUrl,
      albumLabel: row.albumLabel,
      isFeatured: row.isFeatured,
    };
  });
  return [
    ...events.filter((event) => event.isFeatured),
    ...events.filter((event) => !event.isFeatured),
  ];
}

export type CreativeGroup = "design" | "photography";

export type PublicService = {
  id: number;
  title: string;
  description: string;
  icon: string;
  group: CreativeGroup;
  items: string[];
};

export type PublicFaq = {
  id: number;
  question: string;
  answer: string;
  group: CreativeGroup;
};

const asGroup = (value: string): CreativeGroup =>
  value === "photography" ? "photography" : "design";

// The Services page's cards, in the admin's order (design.md §14.24).
export async function listPublishedServices(
  db: Database,
  lang: Lang = "en",
): Promise<PublicService[]> {
  const rows = await db
    .select()
    .from(creativeServices)
    .where(eq(creativeServices.isPublished, true))
    .orderBy(asc(creativeServices.orderIndex), asc(creativeServices.id));
  return rows.map((english) => {
    const row = localize(english, lang, ["title", "description", "items"]);
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      icon: row.icon,
      group: asGroup(row.groupName),
      items: row.items,
    };
  });
}

export async function listPublishedFaqs(
  db: Database,
  lang: Lang = "en",
): Promise<PublicFaq[]> {
  const rows = await db
    .select()
    .from(creativeFaqs)
    .where(eq(creativeFaqs.isPublished, true))
    .orderBy(asc(creativeFaqs.orderIndex), asc(creativeFaqs.id));
  return rows.map((english) => {
    const row = localize(english, lang, ["question", "answer"]);
    return {
      id: row.id,
      question: row.question,
      answer: row.answer,
      group: asGroup(row.groupName),
    };
  });
}

// The creatives site's wording: the stored row over the built-in wording.
export async function getCreativesCopy(
  db: Database,
  lang: Lang = "en",
): Promise<CreativesSettings> {
  const [row] = await db
    .select()
    .from(creativesSettings)
    .where(eq(creativesSettings.id, 1));
  return withCreativesDefaults(row, lang);
}

// The socials shown on the creatives site (the footer and the contact block).
export async function listCreativesSocials(
  db: Database,
): Promise<{ platform: string; url: string }[]> {
  return db
    .select({ platform: socials.platform, url: socials.url })
    .from(socials)
    .where(and(arrayContains(socials.showOn, ["creatives"])))
    .orderBy(asc(socials.orderIndex), asc(socials.id));
}
