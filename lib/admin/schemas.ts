import { z } from "zod";
import { SERVICE_ICONS } from "./serviceIcons";

// What each admin resource accepts (design.md §14.11), used by the API to
// validate bodies against an explicit field list (unknown fields are refused,
// architecture.md §5) and by the editor to check fields as they are typed.

// Blank text and a missing field both mean "nothing": null.
const clean = (value: unknown) =>
  value === undefined || (typeof value === "string" && value.trim() === "")
    ? null
    : value;

/** Required text, trimmed. */
const text = (label: string, max: number) =>
  z
    .string({ error: `Enter the ${label}.` })
    .trim()
    .min(1, `Enter the ${label}.`)
    .max(max, `Keep the ${label} under ${max} characters.`);

const URL_MESSAGE = "Enter a web address starting with https://";

const isHttp = (value: string) => {
  try {
    const { protocol } = new URL(value);
    return protocol === "https:" || protocol === "http:";
  } catch {
    return false;
  }
};

/** A web address (https:// or http://). */
const httpUrl = z
  .string({ error: URL_MESSAGE })
  .trim()
  .max(500, "That address is too long.")
  .refine(isHttp, URL_MESSAGE);

const optionalUrl = z.preprocess(clean, httpUrl.nullable());

/** An image: a web address, or a path on this site such as /certs/badge.png. */
const optionalImage = z.preprocess(
  clean,
  z
    .string()
    .trim()
    .max(500, "That address is too long.")
    .refine(
      (value) =>
        isHttp(value) || (/^\/[^/\\\s]/.test(value) && !value.includes("..")),
      "Enter an image address starting with https://",
    )
    .nullable(),
);

const optionalDate = z.preprocess(
  clean,
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a date.")
    .refine((value) => !Number.isNaN(Date.parse(value)), "Enter a date.")
    .nullable(),
);

const published = z.boolean({ error: "Published must be on or off." });

export const SKILL_CATEGORIES = [
  ["language", "Language"],
  ["framework", "Framework"],
  ["database", "Database"],
  ["cloud", "Cloud & DevOps"],
  ["tool", "Tool"],
] as const;

export const SOCIAL_ICONS = [
  ["instagram", "Instagram"],
  ["linkedin", "LinkedIn"],
  ["github", "GitHub"],
  ["tiktok", "TikTok"],
  ["whatsapp", "WhatsApp"],
  ["link", "Link"],
] as const;

export const SOCIAL_SITES = [
  ["main", "Main"],
  ["creatives", "Creatives"],
  ["blog", "Blog"],
] as const;

const values = <T extends readonly (readonly [string, string])[]>(list: T) =>
  list.map(([value]) => value) as unknown as [T[number][0], ...T[number][0][]];

const tagList = (label: string, maxItems: number, maxLength: number) =>
  z
    .array(
      z
        .string()
        .trim()
        .min(1)
        .max(maxLength, `Keep each ${label} under ${maxLength} characters.`),
    )
    .max(maxItems, `Add at most ${maxItems} ${label}s.`)
    .refine(
      (list) =>
        new Set(list.map((item) => item.toLowerCase())).size === list.length,
      `Each ${label} can be added once.`,
    );

export const skillSchema = z
  .object({
    name: text("name", 60),
    category: z.enum(values(SKILL_CATEGORIES), {
      error: "Choose a category.",
    }),
    iconSlug: z.preprocess(
      clean,
      z
        .string()
        .trim()
        .regex(
          /^[a-z0-9-]+$/,
          "Use lowercase letters, numbers and hyphens, like react.",
        )
        .max(60)
        .nullable(),
    ),
    iconUrl: optionalImage,
    isPublished: published,
  })
  .strict();

export const serviceSchema = z
  .object({
    title: text("title", 80),
    description: text("description", 400),
    icon: z.enum(SERVICE_ICONS, { error: "Choose an icon." }),
    items: tagList("item", 8, 60).default([]),
    isPublished: published,
  })
  .strict();

export const certificationSchema = z
  .object({
    name: text("name", 120),
    issuer: text("issuer", 80),
    issuedOn: optionalDate,
    badgeUrl: optionalImage,
    credentialUrl: optionalUrl,
    isPublished: published,
  })
  .strict();

export const socialSchema = z
  .object({
    platform: text("platform", 40),
    url: httpUrl,
    icon: z.enum(values(SOCIAL_ICONS), { error: "Choose an icon." }),
    showOn: z
      .array(z.enum(values(SOCIAL_SITES)))
      .min(1, "Choose at least one site.")
      .refine(
        (list) => new Set(list).size === list.length,
        "Choose each site once.",
      ),
  })
  .strict();

export const faqSchema = z
  .object({
    question: text("question", 200),
    answer: text("answer", 1500),
    isPublished: published,
  })
  .strict();

export const reorderSchema = z
  .object({
    ids: z
      .array(z.number().int().positive())
      .min(1)
      .max(500)
      .refine((ids) => new Set(ids).size === ids.length, "Each entry once."),
  })
  .strict();

// Shared by the API: the first message for each field of a failed parse.
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? String(issue.path[0]) : "_";
    if (!(key in fields)) fields[key] = issue.message;
  }
  return fields;
}
