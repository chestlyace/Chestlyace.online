import type { ReactNode } from "react";
import { FOOTER_DESCRIPTIONS } from "@/content/copy";
import type { FooterLink } from "@/lib/chrome";
import { SITE_KEYS, SITE_LABELS, siteUrl, type SiteKey } from "@/lib/sites";
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
  connect,
  contact,
}: {
  site: SiteKey;
  connect?: readonly FooterLink[];
  contact?: readonly FooterLink[];
}) {
  return (
    <footer data-band="alt" className="bg-background-alt">
      <Container className="pt-24 md:pt-32">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Brand size="lg" />
            <p className="mt-6 max-w-[36ch] text-lead text-muted">
              {FOOTER_DESCRIPTIONS[site]}
            </p>
          </div>

          <nav
            aria-label="Footer"
            className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3 lg:col-span-7"
          >
            <Column title="Sites">
              {SITE_KEYS.map((key) => {
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
                          {SITE_LABELS[key]}
                        </TextLink>
                      </span>
                    ) : (
                      <TextLink
                        href={siteUrl(key)}
                        tone="footer"
                        icon="up-right"
                        srHint={`opens the ${SITE_LABELS[key]} site`}
                      >
                        {SITE_LABELS[key]}
                      </TextLink>
                    )}
                  </li>
                );
              })}
            </Column>

            {connect && connect.length > 0 && (
              <Column title="Connect">
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
              <Column title="Contact" className="col-span-2 sm:col-span-1">
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

        <FooterWordmark />
      </Container>

      <div className="mt-6 border-t border-border">
        <Container className="flex items-center justify-between gap-4 py-6">
          <p className="type-label text-muted">
            © {new Date().getFullYear()} Chestly Ace
          </p>
          <TextLink href="#top" tone="footer" icon="up">
            Back to top
          </TextLink>
        </Container>
      </div>
    </footer>
  );
}
