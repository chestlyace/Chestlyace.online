import type { Metadata } from "next";
import "../../globals.css";

export const metadata: Metadata = {
  title: "Chestly Ace — Design & Photography",
  robots: { index: false, follow: false },
};

export default function CreativesLayout({
  children,
}: LayoutProps<"/sites/creatives">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
