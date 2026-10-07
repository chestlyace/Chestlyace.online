import type { Metadata } from "next";
import { SiteDocument } from "@/components/shared/SiteDocument";
import { siteMetadata } from "@/lib/seo";
import "../../globals.css";

export const metadata: Metadata = siteMetadata("creatives");

export default function CreativesLayout({
  children,
}: LayoutProps<"/sites/creatives">) {
  return <SiteDocument site="creatives">{children}</SiteDocument>;
}
