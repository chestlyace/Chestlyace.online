import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteDocument } from "@/components/shared/SiteDocument";
import type { FooterLink } from "@/lib/chrome";
import { getCachedCreativesSocials } from "@/lib/creatives/cache";
import { isHttpUrl } from "@/lib/links";
import { getCachedHomepageData } from "@/lib/portfolio";
import { LANGS, isLang } from "@/lib/i18n";
import { siteMetadata } from "@/lib/seo";
import "../../../globals.css";
import { CREATIVES_UI } from "@/lib/i18n/ui";

export async function generateMetadata({
  params,
}: LayoutProps<"/sites/creatives/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  return siteMetadata("creatives", isLang(lang) ? lang : undefined);
}

// Both languages are built ahead of time; the layout answers any other value with a
// 404 (docs/i18n.md §3). `dynamicParams = false` is not used: it makes Next fail to
// refresh a page after the admin changes content (NoFallbackError).
export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

export default async function CreativesLayout({
  children,
  params,
}: LayoutProps<"/sites/creatives/[lang]">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  // The footer (design.md §14.25): the socials shown on the creatives site, and the
  // email and WhatsApp from the profile.
  const [socials, { profile }] = await Promise.all([
    getCachedCreativesSocials(),
    getCachedHomepageData(),
  ]);
  const connect: FooterLink[] = socials
    .filter((social) => isHttpUrl(social.url))
    .map((social) => ({
      label: social.platform,
      href: social.url,
      external: true,
    }));
  const contact: FooterLink[] = [];
  if (profile) {
    contact.push({ label: profile.email, href: `mailto:${profile.email}` });
    const digits = profile.whatsappNumber?.replace(/\D/g, "");
    if (digits)
      contact.push({
        label: CREATIVES_UI[lang].whatsapp,
        href: `https://wa.me/${digits}`,
        external: true,
      });
  }
  return (
    <SiteDocument lang={lang} site="creatives" footer={{ connect, contact }}>
      {children}
    </SiteDocument>
  );
}
