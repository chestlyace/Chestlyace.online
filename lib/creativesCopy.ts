import { en } from "@/content/messages/en";
import { fr } from "@/content/messages/fr";
import type { Lang } from "@/lib/i18n";

// The creatives site's wording as the owner edits it in the admin (Creatives →
// Settings, design.md §14.26). A blank or missing field uses the built-in
// wording (content/messages, both languages), so nothing on the site is ever empty. Pure: safe for the browser.

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

/** The built-in wording of each language (content/messages, docs/i18n.md §4). */
const BUILT_IN: Record<Lang, CreativesSettings> = {
  en: en.creativesDefaults,
  fr: fr.creativesDefaults,
};

export const CREATIVES_DEFAULTS: CreativesSettings = BUILT_IN.en;

const clone = (settings: CreativesSettings): CreativesSettings => ({
  ...settings,
  marqueeWords: [...settings.marqueeWords],
});

const text = (value: unknown): string | null =>
  typeof value === "string" && value.trim() !== "" ? value.trim() : null;

const words = (value: unknown): string[] | null => {
  if (!Array.isArray(value)) return null;
  const kept = value
    .filter((word): word is string => typeof word === "string")
    .map((word) => word.trim())
    .filter(Boolean);
  return kept.length > 0 ? kept : null;
};

/**
 * The stored fields, with the built-in wording where one is blank or missing. In French a
 * field is, in order: the French the owner wrote, else the French built-in wording when
 * the English field is still the built-in one (or blank), else the owner's English
 * (docs/i18n.md §5: English fills what French lacks).
 */
export function withCreativesDefaults(
  stored:
    | (Partial<Record<keyof CreativesSettings, unknown>> & {
        translations?: unknown;
      })
    | null
    | undefined,
  lang: Lang = "en",
): CreativesSettings {
  const settings = clone(lang === "fr" ? BUILT_IN.fr : BUILT_IN.en);
  if (!stored) return settings;
  const french =
    stored.translations && typeof stored.translations === "object"
      ? ((stored.translations as { fr?: Record<string, unknown> }).fr ?? {})
      : {};
  for (const field of CREATIVES_TEXT_FIELDS) {
    const english = text(stored[field]);
    if (lang === "fr") {
      settings[field] =
        text(french[field]) ??
        (english === null || english === BUILT_IN.en[field]
          ? BUILT_IN.fr[field]
          : english);
    } else if (english !== null) settings[field] = english;
  }
  const english = words(stored.marqueeWords);
  if (lang === "fr") {
    const translated = words(french.marqueeWords);
    const builtIn = BUILT_IN.en.marqueeWords;
    const same =
      english !== null &&
      english.length === builtIn.length &&
      english.every((word, index) => word === builtIn[index]);
    settings.marqueeWords =
      translated ??
      (english === null || same ? BUILT_IN.fr.marqueeWords : english);
  } else if (english) settings.marqueeWords = english;
  return settings;
}
