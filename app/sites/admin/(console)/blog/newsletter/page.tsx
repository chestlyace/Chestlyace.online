import type { Metadata } from "next";
import { EditorForm } from "@/components/admin/EditorForm";
import { getNewsletter } from "@/lib/admin/api";
import { adminConfig, toValues, type AdminRow } from "@/lib/admin/config";
import { NEWSLETTER_RESOURCE } from "@/lib/admin/resources";
import { getDb } from "@/lib/db";

export const metadata: Metadata = { title: "Newsletter" };

// Always read fresh: the form shows what the blog uses right now.
export const dynamic = "force-dynamic";

// The newsletter's wording and switch (design.md §14.19): one form, no list.
export default async function NewsletterPage() {
  const config = adminConfig("newsletter")!;
  const settings = await getNewsletter(getDb());
  return (
    <>
      <h1 className="text-title text-foreground">
        {NEWSLETTER_RESOURCE.label}
      </h1>
      <p className="mt-2 mb-8 text-body text-muted">
        {NEWSLETTER_RESOURCE.description}
      </p>
      <EditorForm
        resourceId="newsletter"
        initial={toValues(config, { id: 1, ...settings } as AdminRow)}
      />
    </>
  );
}
