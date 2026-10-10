import type { ReactNode } from "react";
import { getMessages } from "@/content/messages";
import { format } from "@/lib/i18n/format";
import { localizedPath, type Lang } from "@/lib/i18n";
import type { FooterLink } from "@/lib/chrome";
import { PUBLIC_SITE_KEYS, siteUrl, type PublicSiteKey } from "@/lib/sites";
import { Brand } from "./Brand";
import { Container } from "./Container";
import { FooterWordmark } from "./FooterWordmark";
import { TextLink } from "./TextLink";

function Column({
  title,
  className,
  children,
}: {
  title: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <p className="type-label mb-4 text-muted">{title}</p>
      <ul className="flex flex-col gap-3">{children}</ul>
    </div>
  );
}

// Giant-wordmark footer (design.md §13.8). Connect and Contact are filled from
// the profile and socials data when that is wired in (Phase 5b.2).
export function SiteFooter({
  site,
  lang,
  connect,
  contact,
}: {
  site: PublicSiteKey;
  lang: Lang;
  connect?: readonly FooterLink[];
  contact?: readonly FooterLink[];
}) {
  const m = getMessages(lang).chrome;
  return (
    <footer data-band="alt" className="bg-background-alt">
      <Container className="pt-24 md:pt-32">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Brand size="lg" homeLabel={m.brandHome} />
            <p className="mt-6 max-w-[36ch] text-lead text-muted">
              {m.footerDescriptions[site]}
            </p>
          </div>

          <nav
            aria-label={m.footer.nav}
            className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3 lg:col-span-7"
          >
            <Column title={m.footer.sites}>
              {PUBLIC_SITE_KEYS.map((key) => {
                const current = key === site;
                return (
                  <li key={key}>
                    {current ? (
                      <span className="inline-flex items-center gap-2">
                        <span
                          className="size-1 rounded-full bg-primary"
                          aria-hidden="true"
                        />
                        <TextLink
                          href="/"
                          tone="footer"
                          aria-current="page"
                          className="text-foreground"
                        >
                          {m.siteNames[key]}
                        </TextLink>
                      </span>
                    ) : (
                      <TextLink
                        href={siteUrl(key, localizedPath("/", lang))}
                        tone="footer"
                        icon="up-right"
                        srHint={format(m.opensSite, {
                          site: m.siteNames[key],
                        })}
                      >
                        {m.siteNames[key]}
                      </TextLink>
                    )}
                  </li>
                );
              })}
            </Column>

            {connect && connect.length > 0 && (
              <Column title={m.footer.connect}>
                {connect.map((link) => (
                  <li key={link.href}>
                    <TextLink
                      href={link.href}
                      tone="footer"
                      external={link.external}
                    >
                      {link.label}
                    </TextLink>
                  </li>
                ))}
              </Column>
            )}

            {contact && contact.length > 0 && (
              <Column
                title={m.footer.contact}
                className="col-span-2 sm:col-span-1"
              >
                {contact.map((link) => (
                  <li key={link.href}>
                    <TextLink
                      href={link.href}
                      tone="footer"
                      external={link.external}
                    >
                      {link.label}
                    </TextLink>
                  </li>
                ))}
              </Column>
            )}
          </nav>
        </div>

        <FooterWordmark words={m.wordmark} />
      </Container>

      <div className="mt-6 border-t border-border">
        <Container className="flex items-center justify-between gap-4 py-6">
          <p className="type-label text-muted">
            {format(m.footer.copyright, { year: new Date().getFullYear() })}
          </p>
          <TextLink href="#top" tone="footer" icon="up">
            {m.footer.backToTop}
          </TextLink>
        </Container>
      </div>
    </footer>
  );
}
