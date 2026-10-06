import { SITE_KEYS, SITE_LABELS, siteUrl, type SiteKey } from "@/lib/sites";
import { cn } from "@/lib/cn";
import { Brand } from "./Brand";
import { Container } from "./Container";

export function SiteFooter({ site }: { site: SiteKey }) {
  return (
    <footer className="border-t border-border bg-background-alt">
      <Container className="flex flex-col gap-8 py-10 md:flex-row md:items-start md:justify-between">
        <Brand className="self-start" />
        <nav aria-labelledby="footer-sites-heading">
          <h2
            id="footer-sites-heading"
            className="mb-3 font-eyebrow text-xs font-semibold tracking-widest text-muted uppercase"
          >
            Sites
          </h2>
          <ul className="flex flex-col gap-1">
            {SITE_KEYS.map((key) => {
              const current = key === site;
              return (
                <li key={key}>
                  <a
                    href={current ? "/" : siteUrl(key)}
                    aria-current={current ? "true" : undefined}
                    className={cn(
                      "inline-flex min-h-11 items-center rounded-sm text-sm hover:underline",
                      current
                        ? "font-semibold text-primary-text"
                        : "text-foreground",
                    )}
                  >
                    {SITE_LABELS[key]}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
      </Container>
      <div className="border-t border-border">
        <Container className="py-6 text-sm text-muted">
          © {new Date().getFullYear()} Chestly Ace
        </Container>
      </div>
    </footer>
  );
}
