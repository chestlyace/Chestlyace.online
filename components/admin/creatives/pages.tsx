import { notFound } from "next/navigation";
import { EditorForm } from "@/components/admin/EditorForm";
import { EditorHeader } from "@/components/admin/EditorHeader";
import { ResourceList } from "@/components/admin/ResourceList";
import { getCreativesSettings } from "@/lib/admin/api";
import { adminConfig, toValues, type AdminRow } from "@/lib/admin/config";
import { eventFromRow, pieceFromRow } from "@/lib/admin/creativesForm";
import { loadEntry, loadList } from "@/lib/admin/pages";
import { findEditable } from "@/lib/admin/resources";
import { getDb } from "@/lib/db";
import { CreativeEditor } from "./CreativeEditor";

// The Creatives group's screens (design.md §14.26), built from the same pieces as
// the other admin screens. Each page file is one line that picks the resource.

const Title = ({ id }: { id: string }) => {
  const resource = findEditable(id)!;
  return (
    <>
      <h1 className="text-title text-foreground">{resource.label}</h1>
      <p className="mt-2 mb-8 text-body text-muted">{resource.description}</p>
    </>
  );
};

export async function CreativesList({ id }: { id: string }) {
  const loaded = await loadList(id);
  if (!loaded) notFound();
  return (
    <>
      <Title id={id} />
      <ResourceList resourceId={id} initial={loaded.rows} />
    </>
  );
}

export async function CreativesNew({ id }: { id: string }) {
  const config = adminConfig(id);
  const resource = findEditable(id);
  if (!config || !resource || config.single) notFound();
  return (
    <>
      <EditorHeader resource={resource} title={`New ${resource.noun}`} />
      {id === "design" || id === "photography" ? (
        <CreativeEditor kind={id} />
      ) : (
        <EditorForm resourceId={id} initial={config.defaults} />
      )}
    </>
  );
}

export async function CreativesEdit({
  id,
  rawId,
}: {
  id: string;
  rawId: string;
}) {
  const loaded = await loadEntry(id, rawId);
  if (!loaded) notFound();
  const { config, resource, row } = loaded;
  return (
    <>
      <EditorHeader
        resource={resource}
        title={`Edit ${config.row(row).title}`}
      />
      {id === "design" ? (
        <CreativeEditor
          key={String(row.id)}
          kind="design"
          itemId={row.id}
          initial={pieceFromRow(row)}
        />
      ) : id === "photography" ? (
        <CreativeEditor
          key={String(row.id)}
          kind="photography"
          itemId={row.id}
          initial={eventFromRow(row)}
        />
      ) : (
        <EditorForm
          key={String(row.id)}
          resourceId={id}
          itemId={row.id}
          initial={toValues(config, row)}
        />
      )}
    </>
  );
}

export async function CreativesSettingsScreen() {
  const config = adminConfig("creatives-settings")!;
  const settings = await getCreativesSettings(getDb());
  return (
    <>
      <Title id="creatives-settings" />
      <EditorForm
        resourceId="creatives-settings"
        initial={toValues(config, { id: 1, ...settings } as AdminRow)}
      />
    </>
  );
}
