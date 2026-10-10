import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteDocument } from "@/components/shared/SiteDocument";
import { getMessages } from "@/content/messages";
import { footerLinks } from "@/lib/chrome";
import { LANGS, isLang } from "@/lib/i18n";
import { getCachedHomepageData } from "@/lib/portfolio";
import { siteMetadata } from "@/lib/seo";
import "../../../globals.css";

export async function generateMetadata({
  params,
}: LayoutProps<"/sites/main/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  return siteMetadata("main", isLang(lang) ? lang : "en");
}

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
  const { footer } = getMessages(lang).chrome;
  const links = footerLinks(await getCachedHomepageData(), {
    whatsapp: footer.whatsapp,
    resume: footer.resume,
  });
  return (
    <SiteDocument site="main" lang={lang} footer={links}>
      {children}
    </SiteDocument>
  );
}
