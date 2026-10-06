import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EditorForm } from "@/components/admin/EditorForm";
import { EditorHeader } from "@/components/admin/EditorHeader";
import { adminConfig } from "@/lib/admin/config";
import { findResource } from "@/lib/admin/resources";

export async function generateMetadata({
  params,
}: PageProps<"/sites/admin/[resource]/new">): Promise<Metadata> {
  const resource = findResource((await params).resource);
  return { title: resource ? `New ${resource.noun}` : "Not found" };
}

// A new entry (design.md §14.11): starts unpublished.
export default async function NewEntryPage({
  params,
}: PageProps<"/sites/admin/[resource]/new">) {
  const id = (await params).resource;
  const config = adminConfig(id);
  const resource = findResource(id);
  if (!config || !resource || config.single) notFound();

  return (
    <>
      <EditorHeader resource={resource} title={`New ${resource.noun}`} />
      <EditorForm resourceId={id} initial={config.defaults} />
    </>
  );
}
