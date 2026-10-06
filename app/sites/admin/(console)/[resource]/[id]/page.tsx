import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EditorForm } from "@/components/admin/EditorForm";
import { EditorHeader } from "@/components/admin/EditorHeader";
import { toValues } from "@/lib/admin/config";
import { loadEntry } from "@/lib/admin/pages";

export const metadata: Metadata = { title: "Edit" };

// One entry's editor (design.md §14.11).
export default async function EditEntryPage({
  params,
}: PageProps<"/sites/admin/[resource]/[id]">) {
  const { resource: id, id: rawId } = await params;
  const loaded = await loadEntry(id, rawId);
  if (!loaded) notFound();
  const { config, resource, row } = loaded;

  return (
    <>
      <EditorHeader
        resource={resource}
        title={`Edit ${config.row(row).title}`}
      />
      {/* Keyed by the row's save time, so a refresh after saving starts clean. */}
      <EditorForm
        key={String(row.id)}
        resourceId={id}
        itemId={row.id}
        initial={toValues(config, row)}
      />
    </>
  );
}
