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

export async function generateStaticParams() {
  return (await getCachedEvents()).map((event) => ({ slug: event.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/sites/creatives/[lang]/photography/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const event = (await getCachedEvents()).find((e) => e.slug === slug);
  if (!event) return {};
  return pageMetadata("creatives", {
    path: `/photography/${event.slug}`,
    title: `${event.title} — Photography — Chestly Ace`,
    description:
      event.description ??
      `Photographs from ${event.title}${event.place ? `, ${event.place}` : ""}.`,
    image: event.cover.url,
  });
}

// One event (design.md §14.23): the hero, the sidebar beside the story and the
// selected pictures, the credits, the next event and the contact block.
export default async function EventPage({
  params,
}: PageProps<"/sites/creatives/[lang]/photography/[slug]">) {
  const { slug } = await params;
  const events = await getCachedEvents();
  const event = events.find((e) => e.slug === slug);
  if (!event) notFound();
  const next = nextEvent(events, slug);

  return (
    <>
      <JsonLd data={eventJsonLd(event)} />
      <EventHero event={event} />
      <div className="py-14 md:py-20">
        <Container className="grid gap-12 lg:grid-cols-12 lg:gap-10">
          <aside
            aria-label="About the event"
            className="grid content-start gap-8 lg:sticky lg:top-28 lg:col-span-4 lg:self-start"
          >
            <Details
              tone="page"
              heading="About the event"
              rows={[
                { term: "Event", value: event.title },
                { term: "Date", value: formatEventDate(event.eventDate) },
                { term: "Place", value: event.place },
                { term: "Role", value: event.role },
              ]}
              tags={{ term: "What was covered", values: event.covered }}
            />
            <AlbumButton event={event} />
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
              CREDITS
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
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  ) : (
                    credit.name
                  )}
                </li>
              ))}
            </ul>
            <AlbumButton event={event} />
          </Container>
        </section>
      )}
      {next && (
        <section aria-labelledby="next-event" className="py-14 md:py-20">
          <Container className="grid gap-6">
            <h2 id="next-event" className="type-label text-muted">
              NEXT EVENT
            </h2>
            <EventTile event={next} featured />
          </Container>
        </section>
      )}
      <ContactBlock />
    </>
  );
}
