import type { Metadata } from "next";
import { SiteDocument } from "@/components/shared/SiteDocument";
import "../../globals.css";

export const metadata: Metadata = {
  title: "Chestly Ace (Amahndong Chestly) — Software Engineer",
  robots: { index: false, follow: false },
};

export default function MainLayout({ children }: LayoutProps<"/sites/main">) {
  return <SiteDocument site="main">{children}</SiteDocument>;
}
