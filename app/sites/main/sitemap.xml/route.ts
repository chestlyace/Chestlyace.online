import { getCachedProjectSlugs } from "@/lib/portfolio";
import { bothLanguages, sitemapXml, textResponse } from "@/lib/seo";

// The main site's pages, in both languages: the homepage, the Projects page and every published project.
export async function GET() {
  const slugs = await getCachedProjectSlugs();
  const urls = [
    ...bothLanguages("main", "/"),
    ...bothLanguages("main", "/projects"),
    ...slugs.flatMap((slug) => bothLanguages("main", `/projects/${slug}`)),
  ];
  return textResponse(sitemapXml(urls), "application/xml");
}
