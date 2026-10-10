import { Button } from "@/components/shared/Button";
import { Container } from "@/components/shared/Container";
import { Reveal } from "@/components/shared/Reveal";
import { SectionHeading } from "@/components/shared/SectionHeading";
import {
  getCachedCreativesCopy,
  getCachedCreativesSocials,
} from "@/lib/creatives/cache";
import { whatsappHref } from "@/lib/contact";
import { isHttpUrl } from "@/lib/links";
import { getCachedHomepageData } from "@/lib/portfolio";
import type { Lang } from "@/lib/i18n";
import { CREATIVES_UI } from "@/lib/i18n/ui";

// The way to ask for work, at the bottom of every creatives page (design.md §13.60,
// owner 2026-10-08): a statement and three buttons, with the wording from the admin
// (Creatives → Settings) and the contact details from the profile.
export async function ContactBlock({ lang }: { lang: Lang }) {
  const t = CREATIVES_UI[lang];
  const MESSAGE = t.contactMessage;
  const [copy, socials, { profile }] = await Promise.all([
    getCachedCreativesCopy(lang),
    getCachedCreativesSocials(),
    getCachedHomepageData(),
  ]);
  const whatsapp = profile?.whatsappNumber
    ? whatsappHref(profile.whatsappNumber, MESSAGE)
    : null;
  const instagram = socials.find(
    (social) =>
      social.platform.toLowerCase() === "instagram" && isHttpUrl(social.url),
  );

  return (
    <section
      id="contact"
      aria-label={t.contactLabel}
      className="bg-background-alt py-24 md:py-32"
    >
      <Container>
        <SectionHeading
          label={t.contactLabel}
          title={copy.contactStatement}
          intro={copy.contactText}
        />
        <Reveal y={16} className="mt-10">
          <div className="flex flex-wrap gap-3">
            {whatsapp && (
              <Button href={whatsapp} external size="lg">
                {t.whatsapp}
              </Button>
            )}
            {profile?.email && (
              <Button
                href={`mailto:${profile.email}`}
                variant="secondary"
                size="lg"
              >
                {t.email}
              </Button>
            )}
            {instagram && (
              <Button
                href={instagram.url}
                external
                variant="secondary"
                size="lg"
              >
                {t.instagram}
              </Button>
            )}
          </div>
          <p className="mt-4 text-sm text-muted">{copy.contactNote}</p>
        </Reveal>
      </Container>
    </section>
  );
}
