import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteDocument } from "@/components/shared/SiteDocument";
import { footerLinks } from "@/lib/chrome";
import { getCachedHomepageData } from "@/lib/portfolio";
import { LANGS, isLang } from "@/lib/i18n";
import { siteMetadata } from "@/lib/seo";
import "../../../globals.css";

export const metadata: Metadata = siteMetadata("main");

// Both languages are built ahead of time; any other value is a 404 (docs/i18n.md §3).
export const dynamicParams = false;
export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

export default async function MainLayout({
  children,
  params,
}: LayoutProps<"/sites/main/[lang]">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  // The footer's Connect and Contact columns come from the database.
  const footer = footerLinks(await getCachedHomepageData());
  return (
    <SiteDocument lang={lang} site="main" footer={footer}>
      {children}
    </SiteDocument>
  );
}
