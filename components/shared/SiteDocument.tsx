import type { ReactNode } from "react";
import { fontVariables } from "@/lib/fonts";
import type { SiteKey } from "@/lib/sites";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

// The <html> class and color-scheme are set by THEME_INIT_SCRIPT before
// hydration, hence suppressHydrationWarning.
export function SiteDocument({
  site,
  children,
}: {
  site: SiteKey;
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
        <SiteHeader site={site} />
        {children}
        <SiteFooter site={site} />
      </body>
    </html>
  );
}
