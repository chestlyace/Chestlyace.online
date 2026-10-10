import { ContactBlock } from "@/components/creatives/ContactBlock";
import { Hero } from "@/components/creatives/home/Hero";
import { Marquee } from "@/components/creatives/home/Marquee";
import { SectionPortal } from "@/components/creatives/home/SectionPortal";
import { SelectedStrip } from "@/components/creatives/home/SelectedStrip";
import { ServicesTeaser } from "@/components/creatives/home/ServicesTeaser";
import { Container } from "@/components/shared/Container";
import { JsonLd } from "@/components/shared/JsonLd";
import { Reveal } from "@/components/shared/Reveal";
import { SectionHeading } from "@/components/shared/SectionHeading";
import {
  getCachedCreativesCopy,
  getCachedEvents,
  getCachedPieces,
  getCachedServices,
} from "@/lib/creatives/cache";
import {
  featuredWork,
  portalImages,
  statementLines,
} from "@/lib/creatives/home";
import { homeJsonLd } from "@/lib/creatives/seo";

// The creatives home page (design.md §14.20): the doodle hero, the marquee, the two
// portals, the selected work, the services teaser and the contact block. The wording
// comes from the admin (Creatives → Settings); the pictures are the pieces and events
// marked featured. The bands alternate counting up from the contact block, so no two
// neighbours share a background.
export default async function CreativesHome() {
  const [copy, pieces, events, services] = await Promise.all([
    getCachedCreativesCopy(),
    getCachedPieces(),
    getCachedEvents(),
    getCachedServices(),
  ]);
  const work = featuredWork(pieces, events);
  const portals = portalImages(pieces, events);

  return (
    <>
      <JsonLd data={homeJsonLd(work, copy.seoDescription)} />
      <Hero
        lines={statementLines(copy.heroStatement)}
        line={copy.heroLine}
        pictures={work
          .slice(0, 6)
          .map((item) => ({ url: item.image.url, alt: item.image.alt }))}
        workHref="#work"
      />
      <Marquee words={copy.marqueeWords} />
      <section id="work" aria-label="Work" className="py-24 md:py-32">
        <Container>
          <SectionHeading index="01" label="WORK" title={copy.portalsTitle} />
          <Reveal className="mt-14 grid gap-4 md:grid-cols-2">
            <SectionPortal
              index="01 — GRAPHIC DESIGN"
              name="Graphic design"
              text={copy.portalDesignText}
              href="/design"
              image={portals.design}
            />
            <SectionPortal
              index="02 — PHOTOGRAPHY"
              name="Photography"
              text={copy.portalPhotographyText}
              href="/photography"
              image={portals.photography}
            />
          </Reveal>
        </Container>
      </section>
      {work.length > 0 && (
        <section
          aria-label="Selected work"
          className="bg-background-alt py-24 md:py-32"
        >
          <Container>
            <SectionHeading index="02" label="SELECTED" title="Selected work" />
          </Container>
          <div className="mt-12">
            <SelectedStrip work={work} />
          </div>
        </section>
      )}
      <ServicesTeaser services={services} />
      <ContactBlock />
    </>
  );
}
