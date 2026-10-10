import type { ReactNode } from "react";
import { NavigationProgress } from "@/components/shared/NavigationProgress";
import { SkipLink } from "@/components/shared/SkipLink";
import { fontVariables } from "@/lib/fonts";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import { AdminProviders } from "./AdminProviders";

// The admin's <html> shell (design.md §13.18): the same fonts, theme and skip link
// as the public sites, without their header, footer or smooth scrolling.
export function AdminDocument({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      data-site="admin"
      className={fontVariables}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-dvh bg-background font-sans text-foreground antialiased">
        <AdminProviders>
          <SkipLink />
          <NavigationProgress />
          {children}
        </AdminProviders>
      </body>
    </html>
  );
}
