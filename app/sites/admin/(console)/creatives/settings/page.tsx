import type { Metadata } from "next";
import { CreativesSettingsScreen } from "@/components/admin/creatives/pages";

export const metadata: Metadata = { title: "Creatives settings" };

// Always read fresh: the form shows the wording the site uses right now.
export const dynamic = "force-dynamic";

export default function Page() {
  return <CreativesSettingsScreen />;
}
