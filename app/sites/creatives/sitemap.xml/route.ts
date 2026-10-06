import { sitemapXml, textResponse } from "@/lib/seo";
import { siteUrl } from "@/lib/sites";

// Just the homepage until this site has more pages.
export function GET() {
  return textResponse(
    sitemapXml([siteUrl("creatives", "/")]),
    "application/xml",
  );
}
