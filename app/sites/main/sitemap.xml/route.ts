import { getCachedProjectSlugs } from "@/lib/portfolio";
import { sitemapXml, textResponse } from "@/lib/seo";
import { siteUrl } from "@/lib/sites";

// The main site's pages: the homepage and every published project.
export async function GET() {
  const slugs = await getCachedProjectSlugs();
  const urls = [
    siteUrl("main", "/"),
    ...slugs.map((slug) => siteUrl("main", `/projects/${slug}`)),
  ];
  return textResponse(sitemapXml(urls), "application/xml");
}
