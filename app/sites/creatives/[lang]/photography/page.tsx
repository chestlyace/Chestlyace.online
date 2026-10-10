import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/ComingSoon";
import { Container } from "@/components/shared/Container";
import { JsonLd } from "@/components/shared/JsonLd";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { ContactBlock } from "@/components/creatives/ContactBlock";
import { EventTile } from "@/components/creatives/EventTile";
import { HeadingDoodle } from "@/components/creatives/home/HeadingDoodle";
import { getCachedCreativesCopy, getCachedEvents } from "@/lib/creatives/cache";
import { photographyJsonLd } from "@/lib/creatives/seo";
import { pageMetadata } from "@/lib/seo";
import { notFound } from "next/navigation";
import { isLang } from "@/lib/i18n";
import { CREATIVES_UI } from "@/lib/i18n/ui";
import { format } from "@/lib/i18n/format";

export async function generateMetadata({
  params,
}: PageProps<"/sites/creatives/[lang]/photography">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const copy = await getCachedCreativesCopy(lang);
  return pageMetadata("creatives", {
    path: "/photography",
    title: CREATIVES_UI[lang].photographyMetaTitle,
    description: copy.photographyIntro,
    lang,
  });
}

// The Photography page (design.md §14.22): the heading, then one tile per event, the
// featured one first and across both columns, then the contact block. With no
// published event it is the coming-soon look.
export default async function PhotographyPage({
  params,
}: PageProps<"/sites/creatives/[lang]/photography">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const t = CREATIVES_UI[lang];
  const [events, copy] = await Promise.all([
    getCachedEvents(lang),
    getCachedCreativesCopy(lang),
  ]);
  if (events.length === 0) return <ComingSoon site="creatives" lang={lang} />;

  return (
    <>
      <JsonLd data={photographyJsonLd(events, undefined, lang)} />
      <div className="pt-28 pb-24 md:pb-32">
        <Container>
          <div className="relative">
            <HeadingDoodle
              kind="squiggle"
              className="absolute top-8 right-2 md:right-24"
            />
            <SectionHeading
              as="h1"
              label={format(t.photographyLabel, { count: events.length })}
              title={t.photographyTitle}
              intro={copy.photographyIntro}
            />
          </div>
          <div className="mt-12 grid gap-x-6 gap-y-14 md:mt-16 md:grid-cols-2 md:gap-y-16">
            {events.map((event, index) => {
              const featured = event.isFeatured && index === 0;
              return (
                <EventTile
                  key={event.slug}
                  event={event}
                  featured={featured}
                  priority={index < 2}
                  className={featured ? "md:col-span-2" : undefined}
                />
              );
            })}
          </div>
          {events.length === 1 && (
            <p className="type-label mt-14 text-muted">{t.moreComingSoon}</p>
          )}
        </Container>
      </div>
      <ContactBlock lang={lang} />
    </>
  );
}
