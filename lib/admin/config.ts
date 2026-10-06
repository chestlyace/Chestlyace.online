import type { z } from "zod";
import type { UploadUse } from "@/lib/cloudinary";
import { timelineDates } from "@/lib/timeline";
import { SERVICE_ICONS } from "./serviceIcons";
import type { ResourceId } from "./resources";
import {
  AVAILABILITY,
  WORK_TYPES,
  journeySchema,
  profileSchema,
  projectSchema,
  volunteeringSchema,
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
  | (Base & { type: "image"; use: UploadUse })
  | (Base & { type: "date" })
  | (Base & { type: "select"; options: Options })
  | (Base & { type: "switch" })
  | (Base & { type: "checks"; options: Options })
  | (Base & { type: "tags"; itemLabel: string; max: number })
  | (Base & { type: "images"; max: number; use: UploadUse })
  | (Base & { type: "slug"; from: string; prefix: string });

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
  /** One row, edited in place: no list, no "New" (the profile). */
  single?: boolean;
  /** Tabs above the list that filter it by a field (experience: work / education). */
  tabs?: { field: string; options: Options };
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
          use: "icon",
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
          use: "badge",
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

const dates = (item: AdminRow) =>
  timelineDates({
    startDate: (item.startDate as string | null) ?? null,
    endDate: (item.endDate as string | null) ?? null,
    datesLabel: (item.datesLabel as string | null) ?? null,
  }) || "no dates";

const timelineFields = (withType: boolean): FieldDef[] => [
  PUBLISHED,
  ...(withType
    ? [
        {
          type: "select",
          name: "type",
          label: "Type",
          options: WORK_TYPES,
        } as FieldDef,
      ]
    : []),
  { type: "text", name: "role", label: "Role or degree", max: 100 },
  { type: "text", name: "organization", label: "Organization", max: 100 },
  {
    type: "text",
    name: "location",
    label: "Location",
    max: 80,
    optional: true,
  },
  { type: "date", name: "startDate", label: "Start date", optional: true },
  {
    type: "date",
    name: "endDate",
    label: "End date",
    optional: true,
    helper: "Leave blank if it is still going.",
  },
  {
    type: "text",
    name: "datesLabel",
    label: "Dates text",
    max: 60,
    optional: true,
    placeholder: "Dec 2025 - Present",
    helper: "Shown instead of the dates above when you fill it in.",
  },
  {
    type: "long",
    name: "description",
    label: "Description",
    max: 600,
    optional: true,
  },
  {
    type: "image",
    name: "logoUrl",
    use: "logo",
    label: "Logo",
    optional: true,
    helper: "The organization's first letter shows when there is none.",
  },
  {
    type: "url",
    name: "linkUrl",
    label: "Link",
    optional: true,
    helper: "The organization's website.",
  },
];

const timelineDefaults = {
  isPublished: false,
  role: "",
  organization: "",
  location: "",
  startDate: "",
  endDate: "",
  datesLabel: "",
  description: "",
  logoUrl: "",
  linkUrl: "",
};

const projects: AdminConfig = {
  id: "projects",
  noun: "project",
  schema: projectSchema,
  hasPublished: true,
  defaults: {
    isPublished: false,
    title: "",
    slug: "",
    categoryLabel: "",
    isFeatured: false,
    summary: "",
    imageUrl: "",
    techStack: [],
    liveUrl: "",
    isLiveUrlPrivate: false,
    sourceUrl: "",
    isSourceUrlPrivate: false,
    description: "",
    problem: "",
    approach: "",
    outcome: "",
    galleryUrls: [],
  },
  groups: [
    {
      fields: [
        PUBLISHED,
        { type: "text", name: "title", label: "Title", max: 80 },
        {
          type: "slug",
          name: "slug",
          label: "Address",
          from: "title",
          prefix: "chestlyace.online/projects/",
        },
        {
          type: "text",
          name: "categoryLabel",
          label: "Category label",
          max: 30,
          optional: true,
          placeholder: "Full Stack",
        },
        {
          type: "switch",
          name: "isFeatured",
          label: "Featured",
          helper:
            "A full-width row on the home page, listed first whatever the order here.",
        },
        {
          type: "long",
          name: "summary",
          label: "Summary",
          max: 300,
          helper: "The card and the top of the project page.",
        },
        {
          type: "image",
          name: "imageUrl",
          use: "project",
          label: "Image",
          optional: true,
          helper: "The card's image and the page's main image.",
        },
        {
          type: "tags",
          name: "techStack",
          label: "Tech stack",
          itemLabel: "technology",
          max: 12,
          optional: true,
        },
      ],
    },
    {
      title: "Links",
      fields: [
        { type: "url", name: "liveUrl", label: "Live link", optional: true },
        {
          type: "switch",
          name: "isLiveUrlPrivate",
          label: "Live link is private",
          helper: "Shows a “Private” tag instead of a button.",
        },
        {
          type: "url",
          name: "sourceUrl",
          label: "Source link",
          optional: true,
        },
        {
          type: "switch",
          name: "isSourceUrlPrivate",
          label: "Source link is private",
          helper: "Shows a “Private” tag instead of a button.",
        },
      ],
    },
    {
      title: "Case study",
      fields: [
        {
          type: "long",
          name: "description",
          label: "Description",
          max: 3000,
          optional: true,
          helper: "Shown when Problem, Approach and Outcome are all empty.",
        },
        {
          type: "long",
          name: "problem",
          label: "Problem",
          max: 2000,
          optional: true,
          helper:
            "Leave a section empty to hide it. Blank lines make paragraphs.",
        },
        {
          type: "long",
          name: "approach",
          label: "Approach",
          max: 2000,
          optional: true,
        },
        {
          type: "long",
          name: "outcome",
          label: "Outcome",
          max: 2000,
          optional: true,
        },
        {
          type: "images",
          name: "galleryUrls",
          use: "project",
          label: "Gallery",
          max: 12,
          optional: true,
          helper: "Shown under the sections, in this order.",
        },
      ],
    },
  ],
  row: (item) => ({
    title: String(item.title),
    subtitle: `${item.categoryLabel ? String(item.categoryLabel) : "No category"} · ${list(item.techStack).length} tech · ${item.isFeatured ? "Featured" : "—"}`,
  }),
};

const experience: AdminConfig = {
  id: "experience",
  noun: "entry",
  schema: journeySchema,
  hasPublished: true,
  tabs: {
    field: "type",
    options: [["all", "All"], ...WORK_TYPES],
  },
  defaults: { ...timelineDefaults, type: "" },
  groups: [{ fields: timelineFields(true) }],
  row: (item) => ({
    title: String(item.role),
    subtitle: `${String(item.organization)} · ${dates(item)}${item.type === "education" ? " · Education" : ""}`,
  }),
};

const volunteering: AdminConfig = {
  id: "volunteering",
  noun: "entry",
  schema: volunteeringSchema,
  hasPublished: true,
  defaults: timelineDefaults,
  groups: [{ fields: timelineFields(false) }],
  row: (item) => ({
    title: String(item.role),
    subtitle: `${String(item.organization)} · ${dates(item)}`,
  }),
};

const profile: AdminConfig = {
  id: "profile",
  noun: "profile",
  schema: profileSchema,
  hasPublished: false,
  single: true,
  defaults: {},
  groups: [
    {
      title: "Identity",
      fields: [
        {
          type: "text",
          name: "name",
          label: "Name",
          max: 80,
          helper: "Shown in the header and the hero.",
        },
        {
          type: "text",
          name: "legalName",
          label: "Legal name",
          max: 80,
          optional: true,
          helper: "For search results.",
        },
        {
          type: "text",
          name: "displayName",
          label: "Display name",
          max: 40,
          optional: true,
          helper: "The logo's wordmark.",
        },
      ],
    },
    {
      title: "Hero",
      fields: [
        {
          type: "text",
          name: "headline",
          label: "Headline",
          max: 60,
          helper:
            "Two words split at the first space, like “Software Engineer”.",
        },
        {
          type: "tags",
          name: "headlineWords",
          label: "Rotating words",
          itemLabel: "word",
          max: 8,
          optional: true,
          helper:
            "The outlined line (“Backend”, “Full-Stack”). The site adds the “&”. Empty hides the line.",
        },
        {
          type: "text",
          name: "tagline",
          label: "Tagline",
          max: 60,
          optional: true,
          helper: "The status pill's text.",
        },
        {
          type: "select",
          name: "availability",
          label: "Availability",
          options: AVAILABILITY,
          optional: true,
          helper: "Only “Open” shows the pill.",
        },
        {
          type: "image",
          name: "heroImageUrl",
          use: "profile",
          label: "Hero image",
          optional: true,
        },
      ],
    },
    {
      title: "About",
      fields: [
        {
          type: "text",
          name: "aboutQuote",
          label: "Quote",
          max: 200,
          optional: true,
          helper: "The statement that lights up as you scroll.",
        },
        {
          type: "long",
          name: "aboutBody",
          label: "Body",
          max: 2000,
          optional: true,
          helper: "Blank lines make paragraphs.",
        },
        {
          type: "image",
          name: "resumeUrl",
          use: "resume",
          label: "Résumé",
          optional: true,
          helper: "A PDF.",
        },
      ],
    },
    {
      title: "Contact",
      fields: [
        { type: "text", name: "email", label: "Email", max: 200 },
        {
          type: "text",
          name: "phone",
          label: "Phone",
          max: 40,
          optional: true,
          placeholder: "+237 676 940 247",
        },
        {
          type: "text",
          name: "whatsappNumber",
          label: "WhatsApp number",
          max: 20,
          optional: true,
          helper: "Digits only, with the country code.",
        },
        {
          type: "text",
          name: "location",
          label: "Location",
          max: 80,
          optional: true,
          placeholder: "Yaoundé, Cameroon",
        },
      ],
    },
  ],
  row: (item) => ({
    title: String(item.name),
    subtitle: String(item.headline),
  }),
};

const CONFIGS: Partial<Record<ResourceId, AdminConfig>> = {
  projects,
  experience,
  volunteering,
  profile,
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
    else if (
      field.type === "tags" ||
      field.type === "checks" ||
      field.type === "images"
    ) {
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
