import type { Metadata } from "next";
import { CreativesEdit } from "@/components/admin/creatives/pages";

export const metadata: Metadata = { title: "Edit" };

export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: PageProps<"/sites/admin/creatives/photography/[id]">) {
  return <CreativesEdit id="photography" rawId={(await params).id} />;
}
