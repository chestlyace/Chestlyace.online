import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/ComingSoon";
import { Container } from "@/components/shared/Container";
import { JsonLd } from "@/components/shared/JsonLd";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { ContactBlock } from "@/components/creatives/ContactBlock";
import { DesignGallery } from "@/components/creatives/DesignGallery";
import { getCachedCreativesCopy, getCachedPieces } from "@/lib/creatives/cache";
import { designJsonLd } from "@/lib/creatives/seo";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const copy = await getCachedCreativesCopy();
  return pageMetadata("creatives", {
    path: "/design",
    title: "Graphic design — Chestly Ace",
    description: copy.designIntro,
  });
}

// The Graphic design gallery (design.md §14.21): the heading, the filter, the
// masonry and the lightbox, then the contact block. With no published piece it is
// the coming-soon look.
export default async function DesignPage() {
  const [pieces, copy] = await Promise.all([
    getCachedPieces(),
    getCachedCreativesCopy(),
  ]);
  if (pieces.length === 0) return <ComingSoon site="creatives" />;

  return (
    <>
      <JsonLd data={designJsonLd(pieces)} />
      <div className="pt-28 pb-24 md:pb-32">
        <Container className="2xl:max-w-[calc(1600px+4rem)]">
          <SectionHeading
            as="h1"
            label={`Graphic design · ${pieces.length}`}
            title="Design"
            intro={copy.designIntro}
          />
          <div className="mt-12 md:mt-16">
            <DesignGallery pieces={pieces} />
          </div>
        </Container>
      </div>
      <ContactBlock />
    </>
  );
}
