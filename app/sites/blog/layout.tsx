import type { Metadata } from "next";
import { SiteDocument } from "@/components/shared/SiteDocument";
import { siteMetadata } from "@/lib/seo";
import "../../globals.css";

export const metadata: Metadata = siteMetadata("blog");

export default function BlogLayout({ children }: LayoutProps<"/sites/blog">) {
  return <SiteDocument site="blog">{children}</SiteDocument>;
}
