import { ContactBlock } from "@/components/creatives/ContactBlock";
import { Hero } from "@/components/creatives/home/Hero";
import { JsonLd } from "@/components/shared/JsonLd";
import {
  getCachedCreativesCopy,
  getCachedEvents,
  getCachedPieces,
} from "@/lib/creatives/cache";
import { featuredWork, statementLines } from "@/lib/creatives/home";
import { homeJsonLd } from "@/lib/creatives/seo";

// The creatives home page (design.md §14.20). So far: the doodle hero and the contact
// block; the marquee, the portals, the selected work and the services teaser follow
// (10b.7). The hero's statement and line come from the admin (Creatives → Settings);
// the pictures in its frames are the pieces and events marked featured.
export default async function CreativesHome() {
  const [copy, pieces, events] = await Promise.all([
    getCachedCreativesCopy(),
    getCachedPieces(),
    getCachedEvents(),
  ]);
  const work = featuredWork(pieces, events);

  return (
    <>
      <JsonLd data={homeJsonLd(work, copy.seoDescription)} />
      <Hero
        lines={statementLines(copy.heroStatement)}
        line={copy.heroLine}
        pictures={work
          .slice(0, 6)
          .map((item) => ({ url: item.image.url, alt: item.image.alt }))}
        workHref="/design"
      />
      <ContactBlock />
    </>
  );
}
