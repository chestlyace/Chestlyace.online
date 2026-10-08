import { and, arrayContains, asc, eq } from "drizzle-orm";
import * as schema from "@/db/schema";
import type { Database } from "@/lib/db";
import {
  withCreativesDefaults,
  type CreativesSettings,
} from "@/lib/creativesCopy";

// Public reads of the creatives site (docs/content-schema.md §5). Results are
// cached as JSON (lib/creatives/cache.ts), so they hold only plain values.
const { designPieces, creativesSettings, socials } = schema;

export type PublicImage = {
  url: string;
  width: number;
  height: number;
  alt: string;
};

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
): Promise<PublicPiece[]> {
  const rows = await db
    .select()
    .from(designPieces)
    .where(eq(designPieces.isPublished, true))
    .orderBy(asc(designPieces.orderIndex), asc(designPieces.id));
  return rows.map((row) => ({
    slug: row.slug,
    title: row.title,
    category: row.category,
    cover: {
      url: row.coverUrl,
      width: row.coverWidth,
      height: row.coverHeight,
      alt: row.coverAlt,
    },
    images: row.images.map((image) => ({
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
  }));
}

// The creatives site's wording: the stored row over the built-in wording.
export async function getCreativesCopy(
  db: Database,
): Promise<CreativesSettings> {
  const [row] = await db
    .select()
    .from(creativesSettings)
    .where(eq(creativesSettings.id, 1));
  return withCreativesDefaults(row);
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
