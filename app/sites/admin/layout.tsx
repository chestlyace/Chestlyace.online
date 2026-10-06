import type { Metadata } from "next";
import { AdminDocument } from "@/components/admin/AdminDocument";
import "../../globals.css";

// The admin is never indexed (D71): this meta tag, the X-Robots-Tag header the
// proxy adds, and robots.txt all say so.
export const metadata: Metadata = {
  title: { default: "Admin — Chestly Ace", template: "%s — Admin" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/sites/admin">) {
  return <AdminDocument>{children}</AdminDocument>;
}
