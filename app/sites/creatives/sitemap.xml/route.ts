import { getCachedEvents, getCachedPieces } from "@/lib/creatives/cache";
import { sitemapXml, textResponse } from "@/lib/seo";
import { siteUrl } from "@/lib/sites";

// The homepage, the Graphic design page once it has pieces, and Photography with
// each of its events; the other pages are added with their steps (10b.5–10b.7).
export async function GET() {
  const [pieces, events] = await Promise.all([
    getCachedPieces(),
    getCachedEvents(),
  ]);
  return textResponse(
    sitemapXml([
      siteUrl("creatives", "/"),
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
