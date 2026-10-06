import {
  CONTACT_FORM_TITLE,
  CONTACT_HEADING,
  CONTACT_INTRO,
} from "@/content/copy";
import {
  CallIcon,
  ChatIcon,
  MessageIcon,
} from "@/components/shared/IconlyIcon";
import { Reveal } from "@/components/shared/Reveal";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { SocialIcon } from "@/components/shared/SocialIcon";
import { Container } from "@/components/shared/Container";
import { displayPhone, whatsappHref } from "@/lib/contact";
import type { HomepageData } from "@/lib/db";
import { phoneHref } from "@/lib/hero";
import { isHttpUrl } from "@/lib/links";
import { qrPath } from "@/lib/qr";
import type { Band } from "@/lib/sections";
import { ContactForm } from "./ContactForm";
import { ContactTile } from "./ContactTile";
import { WhatsAppQr } from "./WhatsAppQr";

type Profile = NonNullable<HomepageData["profile"]>;

// Contact (design.md §14.8): heading, intro, tiles and socials on the left, the
// form on the right; one column on phones and tablets.
export function ContactSection({
  profile,
  socials,
  index,
  band,
}: {
  profile: Profile;
  socials: HomepageData["socials"];
  index: string;
  band: Band;
}) {
  const phone = profile.phone ? phoneHref(profile.phone) : null;
  const whatsapp = profile.whatsappNumber
    ? whatsappHref(profile.whatsappNumber)
    : null;
  const qr = whatsapp ? qrPath(whatsapp) : null;
  const links = socials.filter((social) => isHttpUrl(social.url));

  return (
    <section
      id="contact"
      data-band={band === "alt" ? "alt" : undefined}
      className={`py-24 md:py-40 ${band === "alt" ? "bg-background-alt" : "bg-background"}`}
    >
      <Container className="grid gap-16 lg:grid-cols-12 lg:gap-8">
        <div className="flex flex-col gap-12 lg:col-span-6 lg:pr-8">
          <SectionHeading
            index={index}
            label="Contact"
            title={CONTACT_HEADING}
            intro={CONTACT_INTRO}
          />

          <Reveal className="grid gap-4 sm:grid-cols-2">
            <ContactTile
              className="sm:col-span-2"
              icon={<MessageIcon size={32} />}
              label="Email"
              value={profile.email}
              href={`mailto:${profile.email}`}
              copy={{
                text: profile.email,
                buttonLabel: "Copy email address",
                announcement: "Email address copied",
              }}
            />
            {phone && profile.phone && (
              <ContactTile
                icon={<CallIcon size={32} />}
                label="Phone"
                value={displayPhone(profile.phone)}
                href={phone}
                copy={{
                  text: displayPhone(profile.phone),
                  buttonLabel: "Copy phone number",
                  announcement: "Phone number copied",
                }}
              />
            )}
            {whatsapp && (
              <ContactTile
                icon={<ChatIcon size={32} />}
                label="WhatsApp"
                value="Chat on WhatsApp"
                href={whatsapp}
                external
              >
                {qr && <WhatsAppQr size={qr.size} d={qr.d} />}
              </ContactTile>
            )}
          </Reveal>

          {links.length > 0 && (
            <ul
              aria-label="Social links"
              className="-mx-3 flex flex-wrap gap-x-1 gap-y-1"
            >
              {links.map((social) => (
                <li key={social.id}>
                  <a
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative inline-flex h-11 items-center gap-2 rounded-full px-3 text-muted transition-colors duration-150 hover:text-foreground"
                  >
                    <SocialIcon name={social.icon} className="size-5" />
                    <span className="sr-only text-sm font-medium sm:not-sr-only">
                      {social.platform}
                    </span>
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* The form sits on a card of its own; its fields take the opposite
            tone, so they stay visible on it in both bands. */}
        <div className="self-start rounded-xl bg-tile p-6 [--field-fill:var(--tile-hover)] md:p-8 lg:col-span-6">
          <h3 className="mb-6 text-h3 text-foreground">{CONTACT_FORM_TITLE}</h3>
          <ContactForm whatsappNumber={profile.whatsappNumber} />
        </div>
      </Container>
    </section>
  );
}
