import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/ComingSoon";
import { Container } from "@/components/shared/Container";
import { JsonLd } from "@/components/shared/JsonLd";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { ContactBlock } from "@/components/creatives/ContactBlock";
import { DesignGallery } from "@/components/creatives/DesignGallery";
import { HeadingDoodle } from "@/components/creatives/home/HeadingDoodle";
import { getCachedCreativesCopy, getCachedPieces } from "@/lib/creatives/cache";
import { designJsonLd } from "@/lib/creatives/seo";
import { pageMetadata } from "@/lib/seo";
import { notFound } from "next/navigation";
import { isLang } from "@/lib/i18n";
import { CREATIVES_UI } from "@/lib/i18n/ui";
import { format } from "@/lib/i18n/format";

export async function generateMetadata({
  params,
}: PageProps<"/sites/creatives/[lang]/design">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const copy = await getCachedCreativesCopy(lang);
  return pageMetadata("creatives", {
    path: "/design",
    title: CREATIVES_UI[lang].designMetaTitle,
    description: copy.designIntro,
    lang,
  });
}

// The Graphic design gallery (design.md §14.21): the heading, the filter, the
// masonry and the lightbox, then the contact block. With no published piece it is
// the coming-soon look.
export default async function DesignPage({
  params,
}: PageProps<"/sites/creatives/[lang]/design">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const t = CREATIVES_UI[lang];
  const [pieces, copy] = await Promise.all([
    getCachedPieces(lang),
    getCachedCreativesCopy(lang),
  ]);
  if (pieces.length === 0) return <ComingSoon site="creatives" lang={lang} />;

  return (
    <>
      <JsonLd data={designJsonLd(pieces, undefined, lang)} />
      <div className="pt-28 pb-24 md:pb-32">
        <Container className="2xl:max-w-[calc(1600px+4rem)]">
          <div className="relative">
            <HeadingDoodle
              kind="star"
              className="absolute top-8 right-2 md:right-24"
            />
            <SectionHeading
              as="h1"
              label={format(t.designLabel, { count: pieces.length })}
              title={t.designTitle}
              intro={copy.designIntro}
            />
          </div>
          <div className="mt-12 md:mt-16">
            <DesignGallery pieces={pieces} />
          </div>
        </Container>
      </div>
      <ContactBlock lang={lang} />
    </>
  );
}
