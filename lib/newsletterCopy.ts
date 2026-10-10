import { en } from "@/content/messages/en";
import { fr } from "@/content/messages/fr";
import type { Lang } from "@/lib/i18n";

// The newsletter's wording and its on/off switch, as the owner edits them in the
// admin (Blog → Newsletter) and the blog reads them (design.md §13.34, §14.16).
// One flat record per field (what the table and the form hold); `toCopy` shapes
// it for the box, the confirmation page and the email. A blank or missing field
// uses the built-in wording (content/messages, both languages), so nothing is ever empty on the site.
// Pure: safe for the browser.

export const NEWSLETTER_FIELDS = [
  "boxLabel",
  "boxTitle",
  "boxText",
  "boxHelper",
  "boxSuccess",
  "boxError",
  "boxInvalid",
  "boxRateLimited",
  "confirmedLabel",
  "confirmedTitle",
  "confirmedLead",
  "confirmedButton",
  "failedLabel",
  "failedTitle",
  "failedLead",
  "failedButton",
  "emailSubject",
  "emailIntro",
  "emailAction",
  "emailExpires",
  "emailIgnore",
] as const;
export type NewsletterField = (typeof NEWSLETTER_FIELDS)[number];

export type NewsletterSettings = { enabled: boolean } & Record<
  NewsletterField,
  string
>;

/** The built-in wording of each language (content/messages, docs/i18n.md §4). */
const BUILT_IN: Record<Lang, Record<NewsletterField, string>> = {
  en: en.blog.newsletterDefaults,
  fr: fr.blog.newsletterDefaults,
};

export const NEWSLETTER_DEFAULTS: NewsletterSettings = {
  enabled: true,
  ...BUILT_IN.en,
};

type Stored = Partial<Record<keyof NewsletterSettings, unknown>> & {
  translations?: unknown;
};

const text = (value: unknown): string | null =>
  typeof value === "string" && value.trim() !== "" ? value.trim() : null;

/**
 * The stored fields, with the built-in wording where one is blank or missing. In
 * French a field is, in order: the French the owner wrote, else the French built-in
 * wording when the English field is still the built-in one (or blank), else the
 * English the owner wrote (docs/i18n.md §5: English fills what French lacks).
 */
export function withDefaults(
  stored: Stored | null | undefined,
  lang: Lang = "en",
): NewsletterSettings {
  const settings = { ...NEWSLETTER_DEFAULTS };
  if (!stored) {
    if (lang === "fr") Object.assign(settings, BUILT_IN.fr);
    return settings;
  }
  const french =
    stored.translations && typeof stored.translations === "object"
      ? ((stored.translations as { fr?: Record<string, unknown> }).fr ?? {})
      : {};
  for (const field of NEWSLETTER_FIELDS) {
    const english = text(stored[field]);
    if (lang === "fr") {
      const translated = text(french[field]);
      settings[field] =
        translated ??
        (english === null || english === BUILT_IN.en[field]
          ? BUILT_IN.fr[field]
          : english);
    } else if (english !== null) settings[field] = english;
  }
  if (typeof stored.enabled === "boolean") settings.enabled = stored.enabled;
  return settings;
}

export type NewsletterCopy = {
  enabled: boolean;
  box: {
    label: string;
    title: string;
    text: string;
    helper: string;
    success: string;
    error: string;
    invalid: string;
    rateLimited: string;
  };
  confirmed: { label: string; title: string; lead: string; button: string };
  failed: { label: string; title: string; lead: string; button: string };
  email: {
    subject: string;
    intro: string;
    action: string;
    expires: string;
    ignore: string;
  };
};

export function toCopy(s: NewsletterSettings): NewsletterCopy {
  return {
    enabled: s.enabled,
    box: {
      label: s.boxLabel,
      title: s.boxTitle,
      text: s.boxText,
      helper: s.boxHelper,
      success: s.boxSuccess,
      error: s.boxError,
      invalid: s.boxInvalid,
      rateLimited: s.boxRateLimited,
    },
    confirmed: {
      label: s.confirmedLabel,
      title: s.confirmedTitle,
      lead: s.confirmedLead,
      button: s.confirmedButton,
    },
    failed: {
      label: s.failedLabel,
      title: s.failedTitle,
      lead: s.failedLead,
      button: s.failedButton,
    },
    email: {
      subject: s.emailSubject,
      intro: s.emailIntro,
      action: s.emailAction,
      expires: s.emailExpires,
      ignore: s.emailIgnore,
    },
  };
}
