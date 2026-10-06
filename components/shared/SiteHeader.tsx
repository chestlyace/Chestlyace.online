import { ArrowUpRight } from "lucide-react";
import { SITE_KEYS, SITE_LABELS, siteUrl, type SiteKey } from "@/lib/sites";
import { Brand } from "./Brand";
import { Container } from "./Container";
import { MobileMenu } from "./MobileMenu";
import { ThemeToggle } from "./ThemeToggle";

export function SiteHeader({ site }: { site: SiteKey }) {
  const otherSites = SITE_KEYS.filter((key) => key !== site).map((key) => ({
    label: SITE_LABELS[key],
    href: siteUrl(key),
  }));

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <Container className="relative flex h-16 items-center justify-between gap-4">
        <Brand />
        <nav
          aria-label="Other sites"
          className="hidden items-center gap-1 md:flex"
        >
          {otherSites.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="inline-flex h-11 items-center gap-1 rounded-md px-3 text-sm font-medium text-foreground transition-colors hover:bg-surface-raised"
            >
              {link.label}
              <ArrowUpRight className="size-4 text-muted" aria-hidden="true" />
            </a>
          ))}
          <span className="mx-2 h-6 w-px bg-border" aria-hidden="true" />
          <ThemeToggle />
        </nav>
        <MobileMenu links={otherSites} className="md:hidden" />
      </Container>
    </header>
  );
}
