import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EditorForm } from "@/components/admin/EditorForm";
import { getProfile } from "@/lib/admin/api";
import { adminConfig, toValues, type AdminRow } from "@/lib/admin/config";
import { findResource } from "@/lib/admin/resources";
import { getDb } from "@/lib/db";

export const metadata: Metadata = { title: "Profile" };

// Always read fresh: the form shows what is in the database right now.
export const dynamic = "force-dynamic";

// The profile (design.md §14.11): one form, no list, no delete.
export default async function ProfilePage() {
  const config = adminConfig("profile");
  const resource = findResource("profile");
  const row = await getProfile(getDb());
  if (!config || !resource || !row) notFound();

  return (
    <>
      <h1 className="text-title text-foreground">{resource.label}</h1>
      <p className="mt-2 mb-8 text-body text-muted">{resource.description}</p>
      <EditorForm
        resourceId="profile"
        initial={toValues(config, row as AdminRow)}
      />
    </>
  );
}
