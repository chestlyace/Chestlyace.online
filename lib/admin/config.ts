import type { z } from "zod";
import { SERVICE_ICONS } from "./serviceIcons";
import type { ResourceId } from "./resources";
import {
  SKILL_CATEGORIES,
  SOCIAL_ICONS,
  SOCIAL_SITES,
  certificationSchema,
  faqSchema,
  serviceSchema,
  skillSchema,
  socialSchema,
} from "./schemas";

// How each editable resource looks in the admin (design.md §14.11): its fields,
// its list rows, its validation. Safe for the browser: no database in here.

export type Options = readonly (readonly [value: string, label: string])[];

type Base = {
  name: string;
  label: string;
  optional?: boolean;
  helper?: string;
};

export type FieldDef =
  | (Base & { type: "text"; max: number; placeholder?: string })
  | (Base & { type: "long"; max: number })
  | (Base & { type: "url" })
  | (Base & { type: "image" })
  | (Base & { type: "date" })
  | (Base & { type: "select"; options: Options })
  | (Base & { type: "switch" })
  | (Base & { type: "checks"; options: Options })
  | (Base & { type: "tags"; itemLabel: string; max: number });

export type Values = Record<string, string | boolean | string[]>;

export type AdminRow = Record<string, unknown> & { id: number };

export type AdminConfig = {
  id: ResourceId;
  /** Singular, for "New skill" and "Edit …". */
  noun: string;
  schema: z.ZodObject;
  /** Fields, in order, under optional group titles. */
  groups: { title?: string; fields: FieldDef[] }[];
  hasPublished: boolean;
  defaults: Values;
  /** What a list row says: a title and a second line. */
  row: (item: AdminRow) => { title: string; subtitle: string };
};

const label = (options: Options, value: unknown) =>
  options.find(([v]) => v === value)?.[1] ?? String(value ?? "");

const list = (value: unknown) => (Array.isArray(value) ? value : []);
const firstLine = (value: unknown) =>
  String(value ?? "")
    .split("\n")[0]
    .slice(0, 120);

const PUBLISHED: FieldDef = {
  type: "switch",
  name: "isPublished",
  label: "Published",
  helper: "Off keeps it off the site without deleting it.",
};

const skills: AdminConfig = {
  id: "skills",
  noun: "skill",
  schema: skillSchema,
  hasPublished: true,
  defaults: {
    isPublished: false,
    name: "",
    category: "",
    iconSlug: "",
    iconUrl: "",
  },
  groups: [
    {
      fields: [
        PUBLISHED,
        { type: "text", name: "name", label: "Name", max: 60 },
        {
          type: "select",
          name: "category",
          label: "Category",
          options: SKILL_CATEGORIES,
        },
        {
          type: "text",
          name: "iconSlug",
          label: "Icon name",
          max: 60,
          optional: true,
          placeholder: "react",
          helper:
            "A Devicon name, like react or postgresql (devicon.dev lists them).",
        },
        {
          type: "image",
          name: "iconUrl",
          label: "Icon image",
          optional: true,
          helper: "Used when there is no icon name.",
        },
      ],
    },
  ],
  row: (item) => ({
    title: String(item.name),
    subtitle: `${label(SKILL_CATEGORIES, item.category)} · ${item.iconSlug ? String(item.iconSlug) : item.iconUrl ? "image" : "no icon"}`,
  }),
};

const services: AdminConfig = {
  id: "services",
  noun: "service",
  schema: serviceSchema,
  hasPublished: true,
  defaults: {
    isPublished: false,
    title: "",
    description: "",
    icon: "",
    items: [],
  },
  groups: [
    {
      fields: [
        PUBLISHED,
        { type: "text", name: "title", label: "Title", max: 80 },
        { type: "long", name: "description", label: "Description", max: 400 },
        {
          type: "select",
          name: "icon",
          label: "Icon",
          options: SERVICE_ICONS.map((name) => [name, name] as const),
        },
        {
          type: "tags",
          name: "items",
          label: "Items",
          itemLabel: "item",
          max: 8,
          optional: true,
          helper: "The short bullet list on the card. Press Enter to add one.",
        },
      ],
    },
  ],
  row: (item) => ({
    title: String(item.title),
    subtitle: `${list(item.items).length} ${list(item.items).length === 1 ? "item" : "items"} · icon ${String(item.icon)}`,
  }),
};

const certifications: AdminConfig = {
  id: "certifications",
  noun: "certification",
  schema: certificationSchema,
  hasPublished: true,
  defaults: {
    isPublished: false,
    name: "",
    issuer: "",
    issuedOn: "",
    badgeUrl: "",
    credentialUrl: "",
  },
  groups: [
    {
      fields: [
        PUBLISHED,
        { type: "text", name: "name", label: "Name", max: 120 },
        { type: "text", name: "issuer", label: "Issuer", max: 80 },
        { type: "date", name: "issuedOn", label: "Issued on", optional: true },
        {
          type: "image",
          name: "badgeUrl",
          label: "Badge",
          optional: true,
          helper: "A square image.",
        },
        {
          type: "url",
          name: "credentialUrl",
          label: "Credential link",
          optional: true,
          helper: "The tile links here when it is set.",
        },
      ],
    },
  ],
  row: (item) => ({
    title: String(item.name),
    subtitle: `${String(item.issuer)} · ${item.issuedOn ? String(item.issuedOn) : "no date"}`,
  }),
};

const socials: AdminConfig = {
  id: "socials",
  noun: "link",
  schema: socialSchema,
  hasPublished: false,
  defaults: { platform: "", url: "", icon: "", showOn: ["main"] },
  groups: [
    {
      fields: [
        {
          type: "text",
          name: "platform",
          label: "Platform",
          max: 40,
          placeholder: "GitHub",
        },
        { type: "url", name: "url", label: "Address" },
        { type: "select", name: "icon", label: "Icon", options: SOCIAL_ICONS },
        {
          type: "checks",
          name: "showOn",
          label: "Show on",
          options: SOCIAL_SITES,
        },
      ],
    },
  ],
  row: (item) => ({ title: String(item.platform), subtitle: String(item.url) }),
};

const faq: AdminConfig = {
  id: "faq",
  noun: "question",
  schema: faqSchema,
  hasPublished: true,
  defaults: { isPublished: false, question: "", answer: "" },
  groups: [
    {
      fields: [
        PUBLISHED,
        { type: "text", name: "question", label: "Question", max: 200 },
        {
          type: "long",
          name: "answer",
          label: "Answer",
          max: 1500,
          helper: "Plain text.",
        },
      ],
    },
  ],
  row: (item) => ({
    title: String(item.question),
    subtitle: firstLine(item.answer),
  }),
};

const CONFIGS: Partial<Record<ResourceId, AdminConfig>> = {
  skills,
  services,
  certifications,
  socials,
  faq,
};

export function adminConfig(id: string): AdminConfig | undefined {
  return Object.hasOwn(CONFIGS, id) ? CONFIGS[id as ResourceId] : undefined;
}

// A database row → the editor's form values (blank text for missing).
export function toValues(config: AdminConfig, row: AdminRow): Values {
  const values: Values = {};
  for (const field of config.groups.flatMap((group) => group.fields)) {
    const value = row[field.name];
    if (field.type === "switch") values[field.name] = Boolean(value);
    else if (field.type === "tags" || field.type === "checks") {
      values[field.name] = list(value).map(String);
    } else values[field.name] = value == null ? "" : String(value);
  }
  return values;
}

// The first message per field when `values` don't fit the schema.
export function validate(
  config: AdminConfig,
  values: Values,
): Record<string, string> {
  const result = config.schema.safeParse(values);
  if (result.success) return {};
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.length > 0 ? String(issue.path[0]) : "_";
    if (!(key in errors)) errors[key] = issue.message;
  }
  return errors;
}
