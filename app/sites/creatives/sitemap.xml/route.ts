import { getCachedPieces } from "@/lib/creatives/cache";
import { sitemapXml, textResponse } from "@/lib/seo";
import { siteUrl } from "@/lib/sites";

// The homepage, and the Graphic design page once it has pieces; the other pages
// are added with their steps (10b.4–10b.7).
export async function GET() {
  const pieces = await getCachedPieces();
  return textResponse(
    sitemapXml([
      siteUrl("creatives", "/"),
      ...(pieces.length > 0 ? [siteUrl("creatives", "/design")] : []),
    ]),
    "application/xml",
  );
}
