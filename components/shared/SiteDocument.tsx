import type { ReactNode } from "react";
import { fontVariables } from "@/lib/fonts";
import type { FooterLink } from "@/lib/chrome";
import type { PublicSiteKey } from "@/lib/sites";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import { Providers } from "./Providers";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";
import { SkipLink } from "./SkipLink";

// The <html> class and color-scheme are set by THEME_INIT_SCRIPT before
// hydration, hence suppressHydrationWarning.
export function SiteDocument({
  site,
  footer,
  children,
}: {
  site: PublicSiteKey;
  /** The footer's Connect and Contact columns (main only, from the database). */
  footer?: { connect: readonly FooterLink[]; contact: readonly FooterLink[] };
  children: ReactNode;
}) {
  return (
    <html
      lang="en"
      data-site={site}
      className={fontVariables}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="flex min-h-dvh flex-col bg-background font-sans text-foreground antialiased">
        <Providers>
          <SkipLink />
          <SiteHeader site={site} />
          <main
            id="main"
            tabIndex={-1}
            className="flex flex-1 flex-col outline-none"
          >
            {children}
          </main>
          <SiteFooter
            site={site}
            connect={footer?.connect}
            contact={footer?.contact}
          />
        </Providers>
      </body>
    </html>
  );
}
