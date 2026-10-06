import type { Metadata } from "next";
import "../../globals.css";

export const metadata: Metadata = {
  title: "Chestly Ace (Amahndong Chestly) — Software Engineer",
  robots: { index: false, follow: false },
};

export default function MainLayout({ children }: LayoutProps<"/sites/main">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
