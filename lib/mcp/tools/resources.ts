import { z } from "zod";
import {
  createRow,
  deleteRow,
  getRow,
  listRows,
  reorderRows,
  updateRow,
  type Row,
} from "@/lib/admin/api";
import { adminConfig } from "@/lib/admin/config";
import { CREATIVES_RESOURCES, RESOURCES } from "@/lib/admin/resources";
import { isCreativesResource } from "@/lib/admin/api";
import { toolName } from "../catalog";
import { publishedCreatives, publishedPortfolio } from "../revalidate";
import { hasScope } from "../scopes";
import {
  ToolError,
  defineTool,
  refuse,
  requireConfirm,
  type AnyTool,
  type Caller,
} from "../tool";

// The tools for the admin's lists (docs/mcp.md §5): for each resource `<name>_list`,
// `_get`, `_create`, `_update`, `_set_published`, `_delete` and `_reorder`, all calling the
// admin's own logic (same strict schema, same defaults). `data` is the resource's fields as
// `list_resources` describes them. Guard rails: new items are unpublished; the published
// switch needs `publish`; delete needs the item's name in `confirm`.

/** What identifies an item to a person: the name an agent must repeat to delete it. */
export function labelOf(row: Row): string {
  for (const key of [
    "title",
    "name",
    "question",
    "platform",
    "role",
    "company",
  ]) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return String(row.id);
}

const refresh = (api: string) =>
  isCreativesResource(api) ? publishedCreatives() : publishedPortfolio();

type Translated = { translations?: { fr?: Record<string, unknown> } };

/** French text sent in an update joins what is there, so a field left out is kept. */
function mergeTranslations(current: Row, data: Record<string, unknown>) {
  const sent = (data as Translated).translations;
  if (!sent?.fr) return data;
  const before = (current as Translated).translations?.fr ?? {};
  return { ...data, translations: { fr: { ...before, ...sent.fr } } };
}

function needPublish(caller: Caller) {
  if (!hasScope(caller.scopes, "publish"))
    throw new ToolError(
      "Changing `isPublished` needs the publish scope, which this token does not have. Save the item as it is; the owner can publish it.",
    );
}

/** Yes/no fields the admin's form starts switched off (featured, private link…). */
function offSwitches(schema: { shape: Record<string, unknown> }) {
  const off: Record<string, false> = {};
  for (const [key, field] of Object.entries(schema.shape)) {
    const def = (field as { _zod?: { def?: { type?: string } } })._zod?.def;
    if (def?.type === "boolean" && key !== "isPublished") off[key] = false;
  }
  return off;
}

const id = z
  .number()
  .int()
  .positive()
  .describe("The item's id (from the list tool)");

export function resourceTools(api: string): AnyTool[] {
  const entry = [...RESOURCES, ...CREATIVES_RESOURCES].find(
    (resource) => resource.api === api,
  );
  const config = entry ? adminConfig(entry.id) : undefined;
  if (!config || config.single) return [];
  const name = toolName(api);
  const noun = config.noun;
  const data = z
    .record(z.string(), z.unknown())
    .describe(
      `The ${noun}'s fields, exactly as list_resources describes "${name}" (a JSON object).`,
    );
  const missing = (): never => {
    throw new ToolError(
      `No ${noun} with that id. Use ${name}_list to see them.`,
    );
  };

  const tools: AnyTool[] = [];

  tools.push(
    defineTool({
      name: `${name}_list`,
      title: `List ${noun}s`,
      description: `Every ${noun}, drafts included, in display order.`,
      scope: "read",
      write: false,
      input: {},
      async run(_args, { db }) {
        const items = await listRows(db, api);
        return {
          summary: `Listed ${items.length} ${noun}s`,
          data: { items },
        };
      },
    }),
    defineTool({
      name: `${name}_get`,
      title: `Read a ${noun}`,
      description: `One ${noun} with all its fields, French text included.`,
      scope: "read",
      write: false,
      input: { id },
      async run({ id }, { db }) {
        const row = (await getRow(db, api, id)) ?? missing();
        return { summary: `Read ${noun} ${labelOf(row)}`, data: row };
      },
    }),
    defineTool({
      name: `${name}_create`,
      title: `Add a ${noun}`,
      description: `Adds a ${noun} at the end${config.hasPublished ? ", unpublished (use " + name + "_set_published to put it live)" : ""}.`,
      scope: "write",
      write: true,
      input: { data },
      async run({ data }, { db, caller }) {
        if (config.hasPublished && data.isPublished === true)
          needPublish(caller);
        const result = await createRow(db, api, {
          ...offSwitches(config.schema),
          ...data,
        });
        if (!result.ok) refuse(result, noun);
        refresh(api);
        return {
          summary: `Added ${noun} ${labelOf(result.row)}`,
          data: result.row,
        };
      },
    }),
    defineTool({
      name: `${name}_update`,
      title: `Change a ${noun}`,
      description: `Changes the fields you send in \`data\`; the rest stay. French text goes in data.translations.fr and is merged with what is there.`,
      scope: "write",
      write: true,
      input: { id, data },
      async run({ id, data }, { db, caller }) {
        const current = (await getRow(db, api, id)) ?? missing();
        if (
          config.hasPublished &&
          "isPublished" in data &&
          data.isPublished !== current.isPublished
        )
          needPublish(caller);
        const result = await updateRow(
          db,
          api,
          id,
          mergeTranslations(current, data),
        );
        if (!result.ok) refuse(result, noun);
        refresh(api);
        return {
          summary: `Changed ${noun} ${labelOf(result.row)}`,
          data: result.row,
        };
      },
    }),
  );

  if (config.hasPublished)
    tools.push(
      defineTool({
        name: `${name}_set_published`,
        title: `Publish or hide a ${noun}`,
        description: `Puts a ${noun} live on the site, or hides it again.`,
        scope: "publish",
        write: true,
        alsoNeeds: ["write"],
        input: { id, published: z.boolean() },
        async run({ id, published }, { db }) {
          const current = (await getRow(db, api, id)) ?? missing();
          const result = await updateRow(db, api, id, {
            isPublished: published,
          });
          if (!result.ok) refuse(result, noun);
          refresh(api);
          return {
            summary: `${published ? "Published" : "Hid"} ${noun} ${labelOf(current)}`,
            data: result.row,
          };
        },
      }),
    );

  tools.push(
    defineTool({
      name: `${name}_delete`,
      title: `Delete a ${noun}`,
      description: `Permanently deletes a ${noun}. Send its exact name (title) in \`confirm\`.`,
      scope: "delete",
      write: true,
      hints: { destructive: true },
      input: {
        id,
        confirm: z.string().describe("The item's exact name or title"),
      },
      async run({ id, confirm }, { db }) {
        const row = (await getRow(db, api, id)) ?? missing();
        requireConfirm(confirm, labelOf(row), noun);
        const result = await deleteRow(db, api, id);
        if (!result.ok) refuse(result, noun);
        refresh(api);
        return {
          summary: `Deleted ${noun} ${labelOf(row)}`,
          data: { deleted: labelOf(row) },
        };
      },
    }),
    defineTool({
      name: `${name}_reorder`,
      title: `Reorder ${noun}s`,
      description: `Sets the display order: \`ids\` in the new order (all of them, or a subset that swaps places among themselves).`,
      scope: "write",
      write: true,
      input: { ids: z.array(id).min(1).max(200) },
      async run({ ids }, { db }) {
        const result = await reorderRows(db, api, { ids });
        if (!result.ok) refuse(result, noun);
        refresh(api);
        return { summary: `Reordered ${ids.length} ${noun}s`, data: { ids } };
      },
    }),
  );
  return tools;
}
