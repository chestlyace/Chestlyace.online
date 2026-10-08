import type { Metadata } from "next";
import { CreativesEdit } from "@/components/admin/creatives/pages";

export const metadata: Metadata = { title: "Edit" };

export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: PageProps<"/sites/admin/creatives/services/[id]">) {
  return <CreativesEdit id="creative-services" rawId={(await params).id} />;
}
