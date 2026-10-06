import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ResourceList } from "@/components/admin/ResourceList";
import { loadList } from "@/lib/admin/pages";
import { findResource } from "@/lib/admin/resources";

export async function generateMetadata({
  params,
}: PageProps<"/sites/admin/[resource]">): Promise<Metadata> {
  const { resource } = await params;
  return { title: findResource(resource)?.label ?? "Not found" };
}

// A resource's list (design.md §13.19, §14.11). Screens not built yet show a
// stand-in (Phase 6b.3 and 6b.4).
export default async function ResourcePage({
  params,
}: PageProps<"/sites/admin/[resource]">) {
  const id = (await params).resource;
  const resource = findResource(id);
  if (!resource) notFound();

  const loaded = await loadList(id);
  return (
    <>
      <h1 className="text-title text-foreground">{resource.label}</h1>
      <p className="mt-2 mb-8 text-body text-muted">{resource.description}</p>
      {loaded ? (
        <ResourceList resourceId={id} initial={loaded.rows} />
      ) : (
        <p className="max-w-[44rem] rounded-lg bg-surface-raised p-4 text-sm text-muted">
          This screen arrives in a later step of Phase 6. Until then, edit this
          content in the database.
        </p>
      )}
    </>
  );
}
