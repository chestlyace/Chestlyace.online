import type { Metadata } from "next";
import { SiteDocument } from "@/components/shared/SiteDocument";
import "../../globals.css";

export const metadata: Metadata = {
  title: "Chestly Ace — Blog",
  robots: { index: false, follow: false },
};

export default function BlogLayout({ children }: LayoutProps<"/sites/blog">) {
  return <SiteDocument site="blog">{children}</SiteDocument>;
}
