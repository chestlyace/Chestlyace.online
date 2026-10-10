import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteDocument } from "@/components/shared/SiteDocument";
import { getCachedBlogSocials } from "@/lib/blog/cache";
import type { FooterLink } from "@/lib/chrome";
import { isHttpUrl } from "@/lib/links";
import { LANGS, isLang } from "@/lib/i18n";
import { getMessages } from "@/content/messages";
import { localizedPath } from "@/lib/i18n";
import { siteMetadata } from "@/lib/seo";
import "../../../globals.css";

export async function generateMetadata({
  params,
}: LayoutProps<"/sites/blog/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  return siteMetadata("blog", isLang(lang) ? lang : undefined);
}

// Both languages are built ahead of time; the layout answers any other value with a
// 404 (docs/i18n.md §3). `dynamicParams = false` is not used: it makes Next fail to
// refresh a page after the admin changes content (NoFallbackError).
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
  const m = getMessages(lang).blog;
  const socials = await getCachedBlogSocials();
  const connect: FooterLink[] = [
    ...socials
      .filter((social) => isHttpUrl(social.url))
      .map((social) => ({
        label: social.platform,
        href: social.url,
        external: true,
      })),
    { label: m.footer.rss, href: localizedPath("/rss.xml", lang) },
  ];
  return (
    <SiteDocument
      lang={lang}
      site="blog"
      footer={{
        connect,
        contact: [{ label: m.footer.privacy, href: "/privacy" }],
      }}
    >
      {children}
    </SiteDocument>
  );
}
