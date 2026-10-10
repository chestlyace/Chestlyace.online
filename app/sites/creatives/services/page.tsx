import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/ComingSoon";
import { Button } from "@/components/shared/Button";
import { Container } from "@/components/shared/Container";
import { JsonLd } from "@/components/shared/JsonLd";
import { Reveal } from "@/components/shared/Reveal";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { ContactBlock } from "@/components/creatives/ContactBlock";
import { FaqList } from "@/components/creatives/FaqList";
import { ServiceCard } from "@/components/creatives/ServiceCard";
import { whatsappHref } from "@/lib/contact";
import { getCachedFaqs, getCachedServices } from "@/lib/creatives/cache";
import type { CreativeGroup } from "@/lib/creatives/data";
import { servicesJsonLd } from "@/lib/creatives/seo";
import { getCachedHomepageData } from "@/lib/portfolio";
import { pageMetadata } from "@/lib/seo";

const TITLE = "Design & photography services — Chestly Ace";
const DESCRIPTION =
  "Graphic design, branding and photography services by Chestly Ace (Amahndong Chestly): logos, social media graphics and posters, event and portrait photography.";

export const metadata: Metadata = pageMetadata("creatives", {
  path: "/services",
  title: TITLE,
  description: DESCRIPTION,
});

// Each group's heading, button and the message the button opens WhatsApp with.
const GROUPS: {
  group: CreativeGroup;
  heading: string;
  button: string;
  message: string;
}[] = [
  {
    group: "design",
    heading: "Graphic design",
    button: "Request design work",
    message:
      "Hi Chestly, I saw your services page and I'd like to request some design work: ",
  },
  {
    group: "photography",
    heading: "Photography",
    button: "Book a session",
    message:
      "Hi Chestly, I saw your services page and I'd like to book a photography session: ",
  },
];

// The Services page (design.md §14.24): the heading, each group's service cards with
// a button that opens WhatsApp, the FAQ, then the contact block. The wording comes
// from the admin (Creatives → Services and FAQ). With nothing published it is the
// coming-soon look.
export default async function CreativesServices() {
  const [services, faqs, { profile }] = await Promise.all([
    getCachedServices(),
    getCachedFaqs(),
    getCachedHomepageData(),
  ]);
  if (services.length === 0 && faqs.length === 0)
    return <ComingSoon site="creatives" />;

  const sections = GROUPS.map((g) => ({
    ...g,
    services: services.filter((s) => s.group === g.group),
    whatsapp: profile?.whatsappNumber
      ? whatsappHref(profile.whatsappNumber, g.message)
      : null,
  })).filter((g) => g.services.length > 0);
  const questions = GROUPS.map((g) => ({
    ...g,
    faqs: faqs.filter((f) => f.group === g.group),
  })).filter((g) => g.faqs.length > 0);

  return (
    <>
      {servicesJsonLd(services, faqs).map((data, index) => (
        <JsonLd key={index} data={data} />
      ))}
      <div className="pt-28 pb-24 md:pb-32">
        <Container>
          <SectionHeading
            as="h1"
            label="Services"
            title="Services"
            intro="Graphic design and photography for brands, creators and events: logos, social media graphics and posters, event coverage and portraits."
          />
          <div className="mt-16 grid gap-20 md:mt-24 md:gap-28">
            {sections.map((section) => (
              <section
                key={section.group}
                aria-labelledby={`services-${section.group}`}
                className="grid gap-8"
              >
                <h2
                  id={`services-${section.group}`}
                  className="font-display text-display-lg uppercase"
                >
                  {section.heading}
                </h2>
                <Reveal
                  className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
                  stagger={0.08}
                >
                  {section.services.map((service) => (
                    <ServiceCard key={service.id} service={service} />
                  ))}
                </Reveal>
                {section.whatsapp && (
                  <div>
                    <Button href={section.whatsapp} external size="lg">
                      {section.button}
                    </Button>
                  </div>
                )}
              </section>
            ))}
          </div>
        </Container>
        {questions.length > 0 && (
          <Container narrow className="mt-24 md:mt-32">
            <SectionHeading label="FAQ" title="Questions" size="lg" />
            <div className="mt-12 grid gap-14">
              {questions.map((section) => (
                <section
                  key={section.group}
                  aria-labelledby={`faq-${section.group}`}
                >
                  <h3
                    id={`faq-${section.group}`}
                    className="type-label mb-4 text-muted uppercase"
                  >
                    {section.heading}
                  </h3>
                  <FaqList faqs={section.faqs} />
                </section>
              ))}
            </div>
          </Container>
        )}
      </div>
      <ContactBlock />
    </>
  );
}
