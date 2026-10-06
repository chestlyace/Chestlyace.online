import type { Metadata } from "next";
import "../../globals.css";

export const metadata: Metadata = {
  title: "Chestly Ace — Blog",
  robots: { index: false, follow: false },
};

export default function BlogLayout({ children }: LayoutProps<"/sites/blog">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
