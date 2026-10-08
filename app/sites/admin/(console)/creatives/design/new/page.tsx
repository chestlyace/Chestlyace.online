import type { Metadata } from "next";
import { CreativesNew } from "@/components/admin/creatives/pages";

export const metadata: Metadata = { title: "New Design" };

export default function Page() {
  return <CreativesNew id="design" />;
}
