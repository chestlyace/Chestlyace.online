import type { Metadata } from "next";
import { SiteDocument } from "@/components/shared/SiteDocument";
import { getCachedBlogSocials } from "@/lib/blog/cache";
import type { FooterLink } from "@/lib/chrome";
import { isHttpUrl } from "@/lib/links";
import { siteMetadata } from "@/lib/seo";
import "../../globals.css";

export const metadata: Metadata = siteMetadata("blog");

export default async function BlogLayout({
  children,
}: LayoutProps<"/sites/blog">) {
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
    <SiteDocument site="blog" footer={{ connect, contact: [] }}>
      {children}
    </SiteDocument>
  );
}
