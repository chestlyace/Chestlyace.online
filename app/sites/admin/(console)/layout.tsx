import { AdminShell } from "@/components/admin/AdminShell";
import { requireSession } from "@/lib/admin/auth";
import { siteUrl } from "@/lib/sites";

// Everything after the login: a valid session or back to the sign-in, then the
// shell (design.md §13.18).
export default async function ConsoleLayout({
  children,
}: LayoutProps<"/sites/admin">) {
  await requireSession();
  return <AdminShell siteHref={siteUrl("main")}>{children}</AdminShell>;
}
