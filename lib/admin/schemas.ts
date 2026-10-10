import { z } from "zod";
import {
  TRANSLATABLE,
  TRANSLATION_LIMITS,
  type TranslatableResource,
} from "@/lib/i18n/translatable";
import { SERVICE_ICONS } from "./serviceIcons";

// What each admin resource accepts (design.md §14.11), used by the API to
// validate bodies against an explicit field list (unknown fields are refused,
// architecture.md §5) and by the editor to check fields as they are typed.

// Blank text and a missing field both mean "nothing": null.
const clean = (value: unknown) =>
  value === undefined || (typeof value === "string" && value.trim() === "")
    ? null
    : value;

// The French version of a resource's text (docs/i18n.md §5): `translations: { fr: {…} }`
// with only the fields named in `lib/i18n/translatable.ts`, each optional. Blank values
// are dropped, so the stored object only holds what has been translated.
function translationsSchema(resource: TranslatableResource) {
  const shape: Record<string, z.ZodType> = {};
  // A post's French version also says whether it is live (docs/i18n.md §5).
  if (resource === "blog-posts") shape.published = z.boolean();
  for (const [field, kind] of Object.entries(TRANSLATABLE[resource])) {
    const limit = TRANSLATION_LIMITS[kind];
    shape[field] =
      kind === "list"
        ? z.array(z.string().trim().max(limit)).max(20)
        : z.string().trim().max(limit, "That is too long.");
  }
  const fr = z
    .object(shape)
    .partial()
    .strict()
    .transform((value) => {
      const kept: Record<string, unknown> = {};
      for (const [field, entry] of Object.entries(value)) {
        const list = Array.isArray(entry)
          ? entry.filter((item) => item !== "")
          : entry;
        if (
          list !== undefined &&
          list !== "" &&
          !(Array.isArray(list) && list.length === 0)
        )
          kept[field] = list;
      }
      return kept;
    });
  return z.object({ fr: fr.optional() }).strict();
}

function withTranslations<T extends z.ZodObject>(
  schema: T,
  resource: TranslatableResource,
) {
  return schema.extend({
    translations: translationsSchema(resource).optional(),
  });
}

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

const serviceBase = z
  .object({
    title: text("title", 80),
    description: text("description", 400),
    icon: z.enum(SERVICE_ICONS, { error: "Choose an icon." }),
    items: tagList("item", 8, 60),
    isPublished: published,
  })
  .strict();

export const serviceSchema = withTranslations(serviceBase, "services");

const certificationBase = z
  .object({
    name: text("name", 120),
    issuer: text("issuer", 80),
    issuedOn: optionalDate,
    badgeUrl: optionalImage,
    credentialUrl: optionalUrl,
    isPublished: published,
  })
  .strict();

export const certificationSchema = withTranslations(
  certificationBase,
  "certifications",
);

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

const faqBase = z
  .object({
    question: text("question", 200),
    answer: text("answer", 1500),
    isPublished: published,
  })
  .strict();

export const faqSchema = withTranslations(faqBase, "faqs");

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

const projectBase = z
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

export const projectSchema = withTranslations(projectBase, "projects");

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

const journeyBase = z
  .object({
    type: z.enum(values(WORK_TYPES), { error: "Choose work or education." }),
    ...timelineFields,
  })
  .strict();

export const journeySchema = withTranslations(journeyBase, "journey");

const volunteeringBase = z.object(timelineFields).strict();

export const volunteeringSchema = withTranslations(
  volunteeringBase,
  "volunteering",
);

const profileBase = z
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

export const profileSchema = withTranslations(profileBase, "profile");

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
// ---- blog posts (design.md §13.48, content-schema.md §4) ---------------------------

/** Paths the blog uses itself: a post can't take one as its address. */
export const RESERVED_BLOG_SLUGS = [
  "tags",
  "privacy",
  "newsletter",
  "rss.xml",
  "sitemap.xml",
  "robots.txt",
  "api",
] as const;

const blogTag = z
  .string()
  .trim()
  .min(1)
  .max(30, "Keep each tag under 30 characters.")
  .regex(
    /^[a-z0-9]+(-[a-z0-9]+)*$/,
    "Tags use lowercase letters, numbers and single hyphens, like web-dev.",
  );

const blogPostBase = z
  .object({
    title: text("title", 120),
    slug: z
      .string({ error: "Enter the address." })
      .trim()
      .min(1, "Enter the address.")
      .max(80, "Keep the address under 80 characters.")
      .regex(
        /^[a-z0-9]+(-[a-z0-9]+)*$/,
        "Use lowercase letters, numbers and single hyphens, like my-post.",
      )
      .refine(
        (value) => !(RESERVED_BLOG_SLUGS as readonly string[]).includes(value),
        "That address is used by the blog itself. Choose another.",
      ),
    // A draft may have none yet; publishing asks for it.
    description: z
      .string({ error: "Enter the description." })
      .trim()
      .max(300, "Keep the description under 300 characters."),
    content: z
      .string({ error: "The post's text is missing." })
      .max(200_000, "The post is too long."),
    coverUrl: optionalImage,
    coverAlt: z.preprocess(
      clean,
      z
        .string()
        .trim()
        .max(200, "Keep the cover's description under 200 characters.")
        .nullable(),
    ),
    tags: z
      .array(blogTag)
      .max(8, "Add at most 8 tags.")
      .refine(
        (list) => new Set(list).size === list.length,
        "Each tag can be added once.",
      ),
    status: z.enum(["draft", "published"], {
      error: "Choose draft or published.",
    }),
    publishedAt: z.preprocess(
      clean,
      z
        .string()
        .refine((value) => !Number.isNaN(Date.parse(value)), "Enter a date.")
        .nullable(),
    ),
    commentsEnabled: z.boolean({ error: "Choose on or off." }),
    canonicalUrl: optionalUrl,
    series: z.preprocess(
      clean,
      z
        .string()
        .trim()
        .max(80, "Keep the series name under 80 characters.")
        .nullable(),
    ),
  })
  .strict();

export const blogPostSchema = blogPostBase.extend({
  translations: translationsSchema("blog-posts").optional(),
});

export function fieldErrors(error: z.ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key =
      issue.path[0] === "translations" && issue.path.length >= 3
        ? `fr:${String(issue.path[2])}`
        : issue.path.length > 0
          ? String(issue.path[0])
          : "_";
    if (!(key in fields)) fields[key] = issue.message;
  }
  return fields;
}

// The newsletter's wording and switch (design.md §14.19): every text is required
// here (the form shows the wording in use), at most as long as the layout allows.
const copyText = (label: string, max: number) => text(label, max);

const newsletterBase = z
  .object({
    enabled: z.boolean({ error: "Choose on or off." }),
    boxLabel: copyText("label", 30),
    boxTitle: copyText("title", 80),
    boxText: copyText("text", 200),
    boxHelper: copyText("helper line", 200),
    boxSuccess: copyText("success message", 200),
    boxError: copyText("error message", 200),
    boxInvalid: copyText("invalid-address message", 100),
    boxRateLimited: copyText("too-many-tries message", 200),
    confirmedLabel: copyText("label", 30),
    confirmedTitle: copyText("title", 60),
    confirmedLead: copyText("text", 300),
    confirmedButton: copyText("button", 40),
    failedLabel: copyText("label", 30),
    failedTitle: copyText("title", 60),
    failedLead: copyText("text", 300),
    failedButton: copyText("button", 40),
    emailSubject: copyText("subject", 150),
    emailIntro: copyText("opening line", 300),
    emailAction: copyText("link text", 60),
    emailExpires: copyText("note about the link", 200),
    emailIgnore: copyText("closing note", 300),
  })
  .strict();

export const newsletterSchema = withTranslations(newsletterBase, "newsletter");

// ---- Creatives (design.md §14.26, content-schema.md §5) ----------------------------

const slug = z
  .string({ error: "Enter the address." })
  .trim()
  .min(1, "Enter the address.")
  .max(60, "Keep the address under 60 characters.")
  .regex(
    /^[a-z0-9]+(-[a-z0-9]+)*$/,
    "Use lowercase letters, numbers and single hyphens, like my-piece.",
  );

const pixels = (label: string) =>
  z
    .number({ error: `The ${label} is missing.` })
    .int(`The ${label} must be a whole number.`)
    .min(1, `The ${label} is missing.`)
    .max(20000, `The ${label} is too large.`);

const altText = z
  .string({ error: "Describe the image." })
  .trim()
  .min(1, "Describe the image.")
  .max(200, "Keep the description under 200 characters.");

const caption = z
  .string()
  .trim()
  .max(200, "Keep the caption under 200 characters.")
  .optional();

// A French sibling of an English text inside a list item (docs/i18n.md §5): optional,
// and blank means "not translated".
const frenchSibling = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? undefined : value,
  z
    .string()
    .trim()
    .max(200, "Keep the French text under 200 characters.")
    .optional(),
);

/** One extra image or picture: its address, its pixel size and its alt text. */
const creativeImage = z
  .object({
    url: imageAddress,
    width: pixels("width"),
    height: pixels("height"),
    alt: altText,
    caption,
    altFr: frenchSibling,
    captionFr: frenchSibling,
  })
  .strict();

const pieceImage = creativeImage
  .omit({ caption: true, captionFr: true })
  .strict();

// An https address is required for an album: it leaves the site.
const albumAddress = z.preprocess(
  clean,
  httpUrl.refine((v) => v.startsWith("https://"), URL_MESSAGE).nullable(),
);

const designPieceBase = z
  .object({
    title: text("title", 120),
    slug,
    category: text("category", 40),
    coverUrl: imageAddress,
    coverWidth: pixels("width"),
    coverHeight: pixels("height"),
    coverAlt: altText,
    images: z.array(pieceImage).max(12, "Add at most 12 images."),
    description: longText("description", 3000),
    client: longText("client", 80),
    role: longText("role", 80),
    tools: tagList("tool", 12, 40),
    year: z.preprocess(
      (value) => {
        const cleaned = clean(value);
        return typeof cleaned === "string" && /^\d{1,4}$/.test(cleaned.trim())
          ? Number(cleaned)
          : cleaned;
      },
      z
        .number({ error: "Enter a year, like 2026." })
        .int("Enter a year, like 2026.")
        .min(1990, "Enter a year, like 2026.")
        .max(2100, "Enter a year, like 2026.")
        .nullable(),
    ),
    linkUrl: optionalUrl,
    isFeatured: z.boolean({ error: "Featured must be on or off." }),
    isPublished: published,
  })
  .strict();

export const designPieceSchema = withTranslations(
  designPieceBase,
  "design-pieces",
);

const photoEventBase = z
  .object({
    title: text("title", 120),
    slug,
    eventDate: z
      .string({ error: "Enter a date." })
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a date.")
      .refine((value) => !Number.isNaN(Date.parse(value)), "Enter a date."),
    place: longText("place", 80),
    kind: longText("kind", 30),
    coverUrl: imageAddress,
    coverWidth: pixels("width"),
    coverHeight: pixels("height"),
    coverAlt: altText,
    description: longText("description", 3000),
    role: longText("role", 80),
    covered: tagList("item", 8, 40),
    images: z.array(creativeImage).max(60, "Add at most 60 pictures."),
    credits: z
      .array(
        z
          .object({
            role: text("role", 60),
            roleFr: frenchSibling,
            name: text("name", 80),
            url: z.preprocess(
              (value) => clean(value) ?? undefined,
              httpUrl.optional(),
            ),
          })
          .strict(),
      )
      .max(30, "Add at most 30 credits."),
    albumUrl: albumAddress,
    albumLabel: longText("label", 40),
    isFeatured: z.boolean({ error: "Featured must be on or off." }),
    isPublished: published,
  })
  .strict();

export const photoEventSchema = withTranslations(
  photoEventBase,
  "photo-events",
);

export const CREATIVE_GROUPS = [
  ["design", "Graphic design"],
  ["photography", "Photography"],
] as const;

const creativeServiceBase = z
  .object({
    title: text("title", 80),
    description: text("description", 400),
    icon: z.enum(SERVICE_ICONS, { error: "Choose an icon." }),
    groupName: z.enum(values(CREATIVE_GROUPS), {
      error: "Choose graphic design or photography.",
    }),
    items: tagList("item", 8, 60),
    isPublished: published,
  })
  .strict();

export const creativeServiceSchema = withTranslations(
  creativeServiceBase,
  "creative-services",
);

const creativeFaqBase = z
  .object({
    question: text("question", 200),
    answer: text("answer", 1500),
    groupName: z.enum(values(CREATIVE_GROUPS), {
      error: "Choose graphic design or photography.",
    }),
    isPublished: published,
  })
  .strict();

export const creativeFaqSchema = withTranslations(
  creativeFaqBase,
  "creative-faqs",
);

const creativesSettingsBase = z
  .object({
    heroStatement: text("statement", 60),
    heroLine: text("line", 160),
    designIntro: text("intro", 240),
    photographyIntro: text("intro", 240),
    portalsTitle: text("title", 60),
    portalDesignText: text("text", 160),
    portalPhotographyText: text("text", 160),
    marqueeWords: tagList("word", 8, 30).refine(
      (list) => list.length >= 1,
      "Add at least one word.",
    ),
    contactStatement: text("statement", 80),
    contactText: text("text", 240),
    contactNote: text("note", 120),
    seoDescription: text("description", 200),
  })
  .strict();

export const creativesSettingsSchema = withTranslations(
  creativesSettingsBase,
  "creatives-settings",
);
