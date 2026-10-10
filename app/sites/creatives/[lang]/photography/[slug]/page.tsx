import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AlbumButton } from "@/components/creatives/AlbumButton";
import { ContactBlock } from "@/components/creatives/ContactBlock";
import { Details } from "@/components/creatives/Details";
import { EventHero } from "@/components/creatives/EventHero";
import { EventPictures } from "@/components/creatives/EventPictures";
import { EventTile } from "@/components/creatives/EventTile";
import { Container } from "@/components/shared/Container";
import { JsonLd } from "@/components/shared/JsonLd";
import { getCachedEvents } from "@/lib/creatives/cache";
import { formatEventDate, nextEvent } from "@/lib/creatives/events";
import { eventJsonLd } from "@/lib/creatives/seo";
import { pageMetadata } from "@/lib/seo";
import { isLang } from "@/lib/i18n";
import { CREATIVES_UI } from "@/lib/i18n/ui";
import { format } from "@/lib/i18n/format";
import { NEW_TAB } from "@/lib/i18n/ui";

export async function generateStaticParams() {
  return (await getCachedEvents("en")).map((event) => ({ slug: event.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/sites/creatives/[lang]/photography/[slug]">): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isLang(lang)) return {};
  const t = CREATIVES_UI[lang];
  const event = (await getCachedEvents(lang)).find((e) => e.slug === slug);
  if (!event) return {};
  return pageMetadata("creatives", {
    path: `/photography/${event.slug}`,
    title: format(t.eventMetaTitle, { title: event.title }),
    description:
      event.description ??
      (event.place
        ? format(t.eventMetaFallbackAt, {
            title: event.title,
            place: event.place,
          })
        : format(t.eventMetaFallback, { title: event.title })),
    image: event.cover.url,
    lang,
  });
}

// One event (design.md §14.23): the hero, the sidebar beside the story and the
// selected pictures, the credits, the next event and the contact block.
export default async function EventPage({
  params,
}: PageProps<"/sites/creatives/[lang]/photography/[slug]">) {
  const { lang, slug } = await params;
  if (!isLang(lang)) notFound();
  const t = CREATIVES_UI[lang];
  const events = await getCachedEvents(lang);
  const event = events.find((e) => e.slug === slug);
  if (!event) notFound();
  const next = nextEvent(events, slug);

  return (
    <>
      <JsonLd data={eventJsonLd(event, undefined, lang)} />
      <EventHero event={event} />
      <div className="py-14 md:py-20">
        <Container className="grid gap-12 lg:grid-cols-12 lg:gap-10">
          <aside
            aria-label={t.aboutEvent}
            className="grid content-start gap-8 lg:sticky lg:top-28 lg:col-span-4 lg:self-start"
          >
            <Details
              tone="page"
              heading={t.aboutEvent}
              rows={[
                { term: t.termEvent, value: event.title },
                {
                  term: t.termDate,
                  value: formatEventDate(event.eventDate, lang),
                },
                { term: t.termPlace, value: event.place },
                { term: t.termRole, value: event.role },
              ]}
              tags={{ term: t.covered, values: event.covered }}
            />
            <AlbumButton event={event} lang={lang} />
          </aside>
          <div className="grid gap-10 lg:col-span-8">
            {event.description && (
              <p className="max-w-[60ch] text-lead whitespace-pre-line">
                {event.description}
              </p>
            )}
            <EventPictures event={event} />
          </div>
        </Container>
      </div>
      {event.credits.length > 0 && (
        <section
          aria-labelledby="credits"
          className="bg-background-alt py-14 md:py-20"
        >
          <Container className="grid gap-8">
            <h2 id="credits" className="type-label text-muted">
              {t.credits}
            </h2>
            <ul className="grid gap-x-10 gap-y-3 text-sm sm:grid-cols-2">
              {event.credits.map((credit, index) => (
                <li key={index}>
                  <span className="text-muted">{credit.role} — </span>
                  {credit.url ? (
                    <a
                      href={credit.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline decoration-foreground/40 underline-offset-4 hover:decoration-foreground"
                    >
                      {credit.name}
                      <span className="sr-only"> ({NEW_TAB[lang]})</span>
                    </a>
                  ) : (
                    credit.name
                  )}
                </li>
              ))}
            </ul>
            <AlbumButton event={event} lang={lang} />
          </Container>
        </section>
      )}
      {next && (
        <section aria-labelledby="next-event" className="py-14 md:py-20">
          <Container className="grid gap-6">
            <h2 id="next-event" className="type-label text-muted">
              {t.nextEvent}
            </h2>
            <EventTile event={next} featured />
          </Container>
        </section>
      )}
      <ContactBlock lang={lang} />
    </>
  );
}
