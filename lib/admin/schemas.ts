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
  // Browsers quietly accept spaces in an address (and encode them), Node does not:
  // refusing them outright keeps the editor and the server in agreement.
  if (/\s/.test(value)) return false;
  try {
    const { protocol, hostname } = new URL(value);
    return (protocol === "https:" || protocol === "http:") && hostname !== "";
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

/**
 * A path on this site: `/certs/badge.png`, or the bare `logos/a.png` and
 * `resume.pdf` the old site used.
 */
const isSitePath = (value: string) =>
  /^\/?[A-Za-z0-9][\w./%-]*$/.test(value) && !value.includes("..");

const IMAGE_MESSAGE = "Enter an image address starting with https://";

/** An image or file: a web address or a path on this site. */
const imageAddress = z
  .string()
  .trim()
  .max(500, "That address is too long.")
  .refine((value) => isHttp(value) || isSitePath(value), IMAGE_MESSAGE);

const optionalImage = z.preprocess(clean, imageAddress.nullable());

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
    items: tagList("item", 8, 60),
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

const longText = (label: string, max: number) =>
  z.preprocess(
    clean,
    z
      .string()
      .trim()
      .max(max, `Keep the ${label} under ${max} characters.`)
      .nullable(),
  );

export const AVAILABILITY = [
  ["open", "Open"],
  ["limited", "Limited"],
  ["closed", "Closed"],
] as const;

export const WORK_TYPES = [
  ["work", "Work"],
  ["education", "Education"],
] as const;

export const projectSchema = z
  .object({
    title: text("title", 80),
    slug: z
      .string({ error: "Enter the address." })
      .trim()
      .min(1, "Enter the address.")
      .max(60, "Keep the address under 60 characters.")
      .regex(
        /^[a-z0-9]+(-[a-z0-9]+)*$/,
        "Use lowercase letters, numbers and single hyphens, like my-project.",
      ),
    categoryLabel: longText("label", 30),
    isFeatured: z.boolean({ error: "Featured must be on or off." }),
    summary: text("summary", 300),
    imageUrl: optionalImage,
    techStack: tagList("technology", 12, 40),
    liveUrl: optionalUrl,
    isLiveUrlPrivate: z.boolean({ error: "Choose on or off." }),
    sourceUrl: optionalUrl,
    isSourceUrlPrivate: z.boolean({ error: "Choose on or off." }),
    description: longText("description", 3000),
    problem: longText("text", 2000),
    approach: longText("text", 2000),
    outcome: longText("text", 2000),
    galleryUrls: z.array(imageAddress).max(12, "Add at most 12 images."),
    isPublished: published,
  })
  .strict();

// Experience and volunteering share their fields (design.md §13.13); experience
// adds the type.
const timelineFields = {
  role: text("role", 100),
  organization: text("organization", 100),
  location: longText("place", 80),
  startDate: optionalDate,
  endDate: optionalDate,
  datesLabel: longText("text", 60),
  description: longText("description", 600),
  logoUrl: optionalImage,
  linkUrl: optionalUrl,
  isPublished: published,
};

export const journeySchema = z
  .object({
    type: z.enum(values(WORK_TYPES), { error: "Choose work or education." }),
    ...timelineFields,
  })
  .strict();

export const volunteeringSchema = z.object(timelineFields).strict();

export const profileSchema = z
  .object({
    name: text("name", 80),
    legalName: longText("name", 80),
    displayName: longText("name", 40),
    headline: text("headline", 60),
    headlineWords: tagList("word", 8, 30),
    tagline: longText("tagline", 60),
    availability: z.preprocess(
      clean,
      z
        .enum(values(AVAILABILITY), {
          error: "Choose open, limited or closed.",
        })
        .nullable(),
    ),
    heroImageUrl: optionalImage,
    aboutQuote: longText("quote", 200),
    aboutBody: longText("text", 2000),
    resumeUrl: optionalImage,
    email: z
      .string({ error: "Enter your email address." })
      .trim()
      .min(1, "Enter your email address.")
      .max(200)
      .regex(
        /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
        "Enter a valid email address, like name@example.com.",
      ),
    phone: longText("number", 40),
    whatsappNumber: z.preprocess(
      (value) => {
        const cleaned = clean(value);
        return typeof cleaned === "string"
          ? cleaned.replace(/[\s+()-]/g, "")
          : cleaned;
      },
      z
        .string()
        .regex(
          /^\d{6,15}$/,
          "Digits only, with the country code, like 237676940247.",
        )
        .nullable(),
    ),
    location: longText("place", 80),
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
