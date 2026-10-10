// The fields of each resource that have a French version (docs/i18n.md §5). One list,
// used by the admin API's validation, the admin's editors and lists, and the public
// reads, so a field cannot be translated unless it is named here. Keyed by the
// resource's API name (`/api/admin/<name>`). Pure.

export type TranslationKind =
  /** A short line. */
  | "text"
  /** Longer text (a paragraph, markdown). */
  | "long"
  /** A list of short items (tags, "what's offered", marquee words). */
  | "list"
  /** An uploaded file's address (the French résumé). */
  | "file"
  /** A whole post's markdown. */
  | "article";

export const TRANSLATABLE = {
  profile: {
    headline: "text",
    tagline: "text",
    aboutQuote: "long",
    aboutBody: "long",
    location: "text",
    headlineWords: "list",
    resumeUrl: "file",
  },
  services: { title: "text", description: "long", items: "list" },
  projects: {
    title: "text",
    summary: "long",
    description: "long",
    categoryLabel: "text",
    problem: "long",
    approach: "long",
    outcome: "long",
  },
  journey: {
    role: "text",
    organization: "text",
    location: "text",
    datesLabel: "text",
    description: "long",
  },
  volunteering: {
    role: "text",
    organization: "text",
    location: "text",
    datesLabel: "text",
    description: "long",
  },
  certifications: { name: "text" },
  faqs: { question: "text", answer: "long" },
  "design-pieces": {
    title: "text",
    category: "text",
    coverAlt: "text",
    description: "long",
    client: "text",
    role: "text",
  },
  "photo-events": {
    title: "text",
    place: "text",
    kind: "text",
    coverAlt: "text",
    description: "long",
    role: "text",
    covered: "list",
  },
  "creative-services": { title: "text", description: "long", items: "list" },
  "creative-faqs": { question: "text", answer: "long" },
  "creatives-settings": {
    heroStatement: "text",
    heroLine: "long",
    designIntro: "long",
    photographyIntro: "long",
    portalsTitle: "text",
    portalDesignText: "long",
    portalPhotographyText: "long",
    marqueeWords: "list",
    contactStatement: "text",
    contactText: "long",
    contactNote: "text",
    seoDescription: "long",
  },
  newsletter: {
    boxLabel: "text",
    boxTitle: "text",
    boxText: "long",
    boxHelper: "long",
    boxSuccess: "long",
    boxError: "long",
    boxInvalid: "long",
    boxRateLimited: "long",
    confirmedLabel: "text",
    confirmedTitle: "text",
    confirmedLead: "long",
    confirmedButton: "text",
    failedLabel: "text",
    failedTitle: "text",
    failedLead: "long",
    failedButton: "text",
    emailSubject: "text",
    emailIntro: "long",
    emailAction: "text",
    emailExpires: "long",
    emailIgnore: "long",
  },
  // The blog's French post (title, description, body…) is edited with the post itself.
  "blog-posts": {
    title: "text",
    description: "long",
    content: "article",
    coverAlt: "text",
    series: "text",
  },
} as const satisfies Record<string, Record<string, TranslationKind>>;

export type TranslatableResource = keyof typeof TRANSLATABLE;

export function isTranslatable(name: string): name is TranslatableResource {
  return Object.hasOwn(TRANSLATABLE, name);
}

/** The translatable fields of a resource, in a stable order ([] for one without). */
export function translatableFields(name: string): string[] {
  return isTranslatable(name) ? Object.keys(TRANSLATABLE[name]) : [];
}

/** The longest a French value of each kind may be (a little over the English limits). */
export const TRANSLATION_LIMITS: Record<TranslationKind, number> = {
  text: 300,
  long: 20000,
  list: 80, // per item; at most 20 items
  file: 500,
  article: 200_000,
};
