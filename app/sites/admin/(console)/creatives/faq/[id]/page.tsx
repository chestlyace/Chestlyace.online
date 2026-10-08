import type { Metadata } from "next";
import { CreativesEdit } from "@/components/admin/creatives/pages";

export const metadata: Metadata = { title: "Edit" };

export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: PageProps<"/sites/admin/creatives/faq/[id]">) {
  return <CreativesEdit id="creative-faqs" rawId={(await params).id} />;
}
