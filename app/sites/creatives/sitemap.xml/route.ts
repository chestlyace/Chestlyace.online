import { getCachedEvents, getCachedPieces } from "@/lib/creatives/cache";
import { bothLanguages, sitemapXml, textResponse } from "@/lib/seo";

// The homepage, Services, the Graphic design page once it has pieces, and Photography
// with each of its events, each in both languages (docs/i18n.md §6).
export async function GET() {
  const [pieces, events] = await Promise.all([
    getCachedPieces("en"),
    getCachedEvents("en"),
  ]);
  return textResponse(
    sitemapXml([
      ...bothLanguages("creatives", "/"),
      ...bothLanguages("creatives", "/services"),
      ...(pieces.length > 0 ? bothLanguages("creatives", "/design") : []),
      ...(events.length > 0
        ? [
            ...bothLanguages("creatives", "/photography"),
            ...events.flatMap((event) =>
              bothLanguages("creatives", `/photography/${event.slug}`),
            ),
          ]
        : []),
    ]),
    "application/xml",
  );
}
