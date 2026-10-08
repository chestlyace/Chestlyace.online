import type { Metadata } from "next";
import { SiteDocument } from "@/components/shared/SiteDocument";
import type { FooterLink } from "@/lib/chrome";
import { getCachedCreativesSocials } from "@/lib/creatives/cache";
import { isHttpUrl } from "@/lib/links";
import { getCachedHomepageData } from "@/lib/portfolio";
import { siteMetadata } from "@/lib/seo";
import "../../globals.css";

export const metadata: Metadata = siteMetadata("creatives");

export default async function CreativesLayout({
  children,
}: LayoutProps<"/sites/creatives">) {
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
        label: "WhatsApp",
        href: `https://wa.me/${digits}`,
        external: true,
      });
  }
  return (
    <SiteDocument site="creatives" footer={{ connect, contact }}>
      {children}
    </SiteDocument>
  );
}
