import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findResource } from "@/lib/admin/resources";

export async function generateMetadata({
  params,
}: PageProps<"/sites/admin/[resource]">): Promise<Metadata> {
  const { resource } = await params;
  return { title: findResource(resource)?.label ?? "Not found" };
}

// A stand-in until the screen is built (Phase 6b.2 to 6b.4); the nav and the
// dashboard already link here.
export default async function ResourcePage({
  params,
}: PageProps<"/sites/admin/[resource]">) {
  const resource = findResource((await params).resource);
  if (!resource) notFound();

  return (
    <>
      <h1 className="text-title text-foreground">{resource.label}</h1>
      <p className="mt-2 mb-8 text-body text-muted">{resource.description}</p>
      <p className="max-w-[44rem] rounded-lg bg-surface-raised p-4 text-sm text-muted">
        This screen arrives in a later step of Phase 6. Until then, edit this
        content in the database.
      </p>
    </>
  );
}
