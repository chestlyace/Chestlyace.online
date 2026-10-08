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

// The way to ask for work, at the bottom of every creatives page (design.md §13.60,
// owner 2026-10-08): a statement and three buttons, with the wording from the admin
// (Creatives → Settings) and the contact details from the profile.
const MESSAGE =
  "Hi Chestly, I saw your creative work and I'd like to talk about…";

export async function ContactBlock() {
  const [copy, socials, { profile }] = await Promise.all([
    getCachedCreativesCopy(),
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
      aria-labelledby="creatives-contact"
      className="bg-background-alt py-24 md:py-32"
    >
      <Container>
        <SectionHeading
          label="Contact"
          title={copy.contactStatement}
          intro={copy.contactText}
        />
        <Reveal y={16} className="mt-10">
          <div className="flex flex-wrap gap-3">
            {whatsapp && (
              <Button href={whatsapp} external size="lg">
                WhatsApp
              </Button>
            )}
            {profile?.email && (
              <Button
                href={`mailto:${profile.email}`}
                variant="secondary"
                size="lg"
              >
                Email
              </Button>
            )}
            {instagram && (
              <Button
                href={instagram.url}
                external
                variant="secondary"
                size="lg"
              >
                Instagram
              </Button>
            )}
          </div>
          <p className="mt-4 text-sm text-muted">{copy.contactNote}</p>
        </Reveal>
      </Container>
    </section>
  );
}
