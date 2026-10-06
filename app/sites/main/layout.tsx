import type { Metadata } from "next";
import { SiteDocument } from "@/components/shared/SiteDocument";
import { footerLinks } from "@/lib/chrome";
import { getCachedHomepageData } from "@/lib/portfolio";
import "../../globals.css";

export const metadata: Metadata = {
  title: "Chestly Ace (Amahndong Chestly) — Software Engineer",
  robots: { index: false, follow: false },
};

export default async function MainLayout({
  children,
}: LayoutProps<"/sites/main">) {
  // The footer's Connect and Contact columns come from the database.
  const footer = footerLinks(await getCachedHomepageData());
  return (
    <SiteDocument site="main" footer={footer}>
      {children}
    </SiteDocument>
  );
}
