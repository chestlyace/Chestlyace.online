import type { Metadata } from "next";
import { SiteDocument } from "@/components/shared/SiteDocument";
import "../../globals.css";

export const metadata: Metadata = {
  title: "Chestly Ace — Design & Photography",
  robots: { index: false, follow: false },
};

export default function CreativesLayout({
  children,
}: LayoutProps<"/sites/creatives">) {
  return <SiteDocument site="creatives">{children}</SiteDocument>;
}
