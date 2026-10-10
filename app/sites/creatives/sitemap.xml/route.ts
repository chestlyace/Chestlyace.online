import { getCachedEvents, getCachedPieces } from "@/lib/creatives/cache";
import { sitemapXml, textResponse } from "@/lib/seo";
import { siteUrl } from "@/lib/sites";

// The homepage, the Graphic design page once it has pieces, and Photography with
// each of its events; the home page's remaining parts follow (10b.6–10b.7).
export async function GET() {
  const [pieces, events] = await Promise.all([
    getCachedPieces("en"),
    getCachedEvents("en"),
  ]);
  return textResponse(
    sitemapXml([
      siteUrl("creatives", "/"),
      siteUrl("creatives", "/services"),
      ...(pieces.length > 0 ? [siteUrl("creatives", "/design")] : []),
      ...(events.length > 0
        ? [
            siteUrl("creatives", "/photography"),
            ...events.map((event) =>
              siteUrl("creatives", `/photography/${event.slug}`),
            ),
          ]
        : []),
    ]),
    "application/xml",
  );
}
