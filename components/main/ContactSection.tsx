import { getMessages } from "@/content/messages";
import type { Lang } from "@/lib/i18n";
import { NEW_TAB } from "@/lib/i18n/ui";
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
  lang,
  profile,
  socials,
  index,
  band,
}: {
  lang: Lang;
  profile: Profile;
  socials: HomepageData["socials"];
  index: string;
  band: Band;
}) {
  const m = getMessages(lang).home.contact;
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
            label={m.label}
            title={m.heading}
            intro={m.intro}
          />

          <Reveal className="grid gap-4 sm:grid-cols-2">
            <ContactTile
              className="sm:col-span-2"
              icon={<MessageIcon size={32} />}
              label={m.tiles.email}
              value={profile.email}
              href={`mailto:${profile.email}`}
              copy={{
                text: profile.email,
                buttonLabel: m.tiles.copyEmail,
                announcement: m.tiles.emailCopied,
                copiedLabel: m.tiles.copied,
              }}
            />
            {phone && profile.phone && (
              <ContactTile
                icon={<CallIcon size={32} />}
                label={m.tiles.phone}
                value={displayPhone(profile.phone)}
                href={phone}
                copy={{
                  text: displayPhone(profile.phone),
                  buttonLabel: m.tiles.copyPhone,
                  announcement: m.tiles.phoneCopied,
                  copiedLabel: m.tiles.copied,
                }}
              />
            )}
            {whatsapp && (
              <ContactTile
                icon={<ChatIcon size={32} />}
                label={m.tiles.whatsapp}
                value={m.tiles.chat}
                href={whatsapp}
                external
              >
                {qr && <WhatsAppQr size={qr.size} d={qr.d} labels={m.qr} />}
              </ContactTile>
            )}
          </Reveal>

          {links.length > 0 && (
            <ul
              aria-label={m.social}
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
                    <span className="sr-only"> ({NEW_TAB[lang]})</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* The form sits on a card of its own; its fields take the opposite
            tone, so they stay visible on it in both bands. */}
        <div className="self-start rounded-xl bg-tile p-6 [--field-fill:var(--tile-hover)] md:p-8 lg:col-span-6">
          <h3 className="mb-6 text-h3 text-foreground">{m.formTitle}</h3>
          <ContactForm whatsappNumber={profile.whatsappNumber} form={m.form} />
        </div>
      </Container>
    </section>
  );
}
