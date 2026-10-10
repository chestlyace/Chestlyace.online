import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteDocument } from "@/components/shared/SiteDocument";
import { getCachedBlogSocials } from "@/lib/blog/cache";
import type { FooterLink } from "@/lib/chrome";
import { isHttpUrl } from "@/lib/links";
import { LANGS, isLang } from "@/lib/i18n";
import { siteMetadata } from "@/lib/seo";
import "../../../globals.css";

export const metadata: Metadata = siteMetadata("blog");

// Both languages are built ahead of time; any other value is a 404 (docs/i18n.md §3).
export const dynamicParams = false;
export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

export default async function BlogLayout({
  children,
  params,
}: LayoutProps<"/sites/blog/[lang]">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  // The footer's Connect column: the socials shown on the blog, then the feed.
  const socials = await getCachedBlogSocials();
  const connect: FooterLink[] = [
    ...socials
      .filter((social) => isHttpUrl(social.url))
      .map((social) => ({
        label: social.platform,
        href: social.url,
        external: true,
      })),
    { label: "RSS", href: "/rss.xml" },
  ];
  return (
    <SiteDocument
      lang={lang}
      site="blog"
      footer={{ connect, contact: [{ label: "Privacy", href: "/privacy" }] }}
    >
      {children}
    </SiteDocument>
  );
}
