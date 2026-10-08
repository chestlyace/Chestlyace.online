import type { Metadata } from "next";
import { CreativesList } from "@/components/admin/creatives/pages";

export const metadata: Metadata = { title: "Design" };

// Always read fresh: the list shows what is in the database right now.
export const dynamic = "force-dynamic";

export default function Page() {
  return <CreativesList id="design" />;
}
