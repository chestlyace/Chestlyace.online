import { Container } from "@/components/shared/Container";
import { Reveal } from "@/components/shared/Reveal";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { TextLink } from "@/components/shared/TextLink";
import type { PublicService } from "@/lib/creatives/data";
import type { Lang } from "@/lib/i18n";
import { CREATIVES_UI } from "@/lib/i18n/ui";

// The services teaser (design.md §14.20, item 5): the service titles as Bebas rows in
// two columns, each a text-roll link to its group on /services.
export function ServicesTeaser({
  services,
  lang,
}: {
  services: readonly PublicService[];
  lang: Lang;
}) {
  const t = CREATIVES_UI[lang];
  if (services.length === 0) return null;
  return (
    <section aria-label={t.servicesLabel} className="py-24 md:py-32">
      <Container>
        <SectionHeading
          index="03"
          label={t.teaserLabel}
          title={t.teaserTitle}
        />
        <Reveal
          stagger={0.06}
          className="mt-14 grid gap-x-10 gap-y-4 lg:grid-cols-2"
        >
          {services.slice(0, 6).map((service) => (
            <div
              key={service.id}
              data-reveal
              className="border-b border-border py-3"
            >
              <TextLink
                tone="menu"
                className="text-title!"
                href={`/services#services-${service.group}`}
                icon="right"
              >
                {service.title}
              </TextLink>
            </div>
          ))}
        </Reveal>
        <div className="mt-10">
          <TextLink href="/services" icon="right">
            {t.teaserAll}
          </TextLink>
        </div>
      </Container>
    </section>
  );
}
