import { CREATIVES } from "@/content/copy";

// The creatives site's wording as the owner edits it in the admin (Creatives →
// Settings, design.md §14.26). A blank or missing field uses the wording in
// content/copy.ts, so nothing on the site is ever empty. Pure: safe for the browser.

export const CREATIVES_TEXT_FIELDS = [
  "heroStatement",
  "heroLine",
  "designIntro",
  "photographyIntro",
  "portalsTitle",
  "portalDesignText",
  "portalPhotographyText",
  "contactStatement",
  "contactText",
  "contactNote",
  "seoDescription",
] as const;
export type CreativesTextField = (typeof CREATIVES_TEXT_FIELDS)[number];

export type CreativesSettings = Record<CreativesTextField, string> & {
  marqueeWords: string[];
};

export const CREATIVES_DEFAULTS: CreativesSettings = {
  heroStatement: CREATIVES.heroStatement,
  heroLine: CREATIVES.heroLine,
  designIntro: CREATIVES.designIntro,
  photographyIntro: CREATIVES.photographyIntro,
  portalsTitle: CREATIVES.portalsTitle,
  portalDesignText: CREATIVES.portalDesignText,
  portalPhotographyText: CREATIVES.portalPhotographyText,
  marqueeWords: CREATIVES.marqueeWords,
  contactStatement: CREATIVES.contactStatement,
  contactText: CREATIVES.contactText,
  contactNote: CREATIVES.contactNote,
  seoDescription: CREATIVES.seoDescription,
};

/** The stored fields, with the built-in wording where one is blank or missing. */
export function withCreativesDefaults(
  stored: Partial<Record<keyof CreativesSettings, unknown>> | null | undefined,
): CreativesSettings {
  const settings: CreativesSettings = {
    ...CREATIVES_DEFAULTS,
    marqueeWords: [...CREATIVES_DEFAULTS.marqueeWords],
  };
  if (!stored) return settings;
  for (const field of CREATIVES_TEXT_FIELDS) {
    const value = stored[field];
    if (typeof value === "string" && value.trim() !== "")
      settings[field] = value.trim();
  }
  const words = stored.marqueeWords;
  if (Array.isArray(words)) {
    const kept = words
      .filter((word): word is string => typeof word === "string")
      .map((word) => word.trim())
      .filter(Boolean);
    if (kept.length > 0) settings.marqueeWords = kept;
  }
  return settings;
}
