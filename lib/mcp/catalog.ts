import { z } from "zod";
import { adminConfig } from "@/lib/admin/config";
import {
  CREATIVES_RESOURCES,
  NEWSLETTER_RESOURCE,
  RESOURCES,
  type Resource,
} from "@/lib/admin/resources";
import { TRANSLATABLE } from "@/lib/i18n/translatable";

// What the admin edits, described for an agent (`list_resources`, docs/mcp.md §5): each
// resource's name, what it is, whether it has a published switch and an order, which fields
// are translatable, and its fields as a JSON Schema built from the same strict Zod schema
// the admin validates with, so the description cannot drift from the rules.

type Entry = Omit<Resource, "id"> & { id: string; config: string };

const ENTRIES: readonly Entry[] = [
  ...RESOURCES.map((r) => ({ ...r, config: r.id })),
  ...CREATIVES_RESOURCES.map((r) => ({ ...r, config: r.id })),
  { ...NEWSLETTER_RESOURCE, config: "newsletter" },
];

export type ResourceInfo = {
  /** The name tools use: `projects_create`. The API's name, with `-` as `_`. */
  name: string;
  label: string;
  description: string;
  kind: "list" | "single";
  hasPublishedSwitch: boolean;
  translatableFields: string[];
  fields: unknown;
};

export const toolName = (api: string) => api.replace(/-/g, "_");

export function describeResources(): ResourceInfo[] {
  return ENTRIES.flatMap((entry) => {
    const config = adminConfig(entry.config);
    if (!config) return [];
    const translatable = (
      TRANSLATABLE as Record<string, Record<string, string>>
    )[entry.api];
    return [
      {
        name: toolName(entry.api),
        label: entry.label,
        description: entry.description,
        kind: config.single ? "single" : "list",
        hasPublishedSwitch: config.hasPublished,
        translatableFields: translatable ? Object.keys(translatable) : [],
        fields: z.toJSONSchema(config.schema, {
          io: "input",
          unrepresentable: "any",
        }),
      },
    ];
  });
}
