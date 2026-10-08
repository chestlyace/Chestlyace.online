import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/ComingSoon";
import { Container } from "@/components/shared/Container";
import { JsonLd } from "@/components/shared/JsonLd";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { ContactBlock } from "@/components/creatives/ContactBlock";
import { EventTile } from "@/components/creatives/EventTile";
import { getCachedCreativesCopy, getCachedEvents } from "@/lib/creatives/cache";
import { photographyJsonLd } from "@/lib/creatives/seo";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const copy = await getCachedCreativesCopy();
  return pageMetadata("creatives", {
    path: "/photography",
    title: "Photography — Chestly Ace",
    description: copy.photographyIntro,
  });
}

// The Photography page (design.md §14.22): the heading, then one tile per event, the
// featured one first and across both columns, then the contact block. With no
// published event it is the coming-soon look.
export default async function PhotographyPage() {
  const [events, copy] = await Promise.all([
    getCachedEvents(),
    getCachedCreativesCopy(),
  ]);
  if (events.length === 0) return <ComingSoon site="creatives" />;

  return (
    <>
      <JsonLd data={photographyJsonLd(events)} />
      <div className="pt-28 pb-24 md:pb-32">
        <Container>
          <SectionHeading
            as="h1"
            label={`Photography · ${events.length}`}
            title="Photography"
            intro={copy.photographyIntro}
          />
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
            <p className="type-label mt-14 text-muted">More coming soon</p>
          )}
        </Container>
      </div>
      <ContactBlock />
    </>
  );
}
