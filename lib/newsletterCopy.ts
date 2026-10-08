import {
  NEWSLETTER,
  NEWSLETTER_CONFIRMED,
  NEWSLETTER_EMAIL,
  NEWSLETTER_FAILED,
} from "@/content/copy";

// The newsletter's wording and its on/off switch, as the owner edits them in the
// admin (Blog → Newsletter) and the blog reads them (design.md §13.34, §14.16).
// One flat record per field (what the table and the form hold); `toCopy` shapes
// it for the box, the confirmation page and the email. A blank or missing field
// uses the wording in content/copy.ts, so nothing is ever empty on the site.
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

export const NEWSLETTER_DEFAULTS: NewsletterSettings = {
  enabled: true,
  boxLabel: NEWSLETTER.label,
  boxTitle: NEWSLETTER.title,
  boxText: NEWSLETTER.text,
  boxHelper: NEWSLETTER.helper,
  boxSuccess: NEWSLETTER.success,
  boxError: NEWSLETTER.error,
  boxInvalid: NEWSLETTER.invalid,
  boxRateLimited: NEWSLETTER.rateLimited,
  confirmedLabel: NEWSLETTER_CONFIRMED.label,
  confirmedTitle: NEWSLETTER_CONFIRMED.title,
  confirmedLead: NEWSLETTER_CONFIRMED.lead,
  confirmedButton: NEWSLETTER_CONFIRMED.button,
  failedLabel: NEWSLETTER_FAILED.label,
  failedTitle: NEWSLETTER_FAILED.title,
  failedLead: NEWSLETTER_FAILED.lead,
  failedButton: NEWSLETTER_FAILED.button,
  emailSubject: NEWSLETTER_EMAIL.subject,
  emailIntro: NEWSLETTER_EMAIL.intro,
  emailAction: NEWSLETTER_EMAIL.action,
  emailExpires: NEWSLETTER_EMAIL.expires,
  emailIgnore: NEWSLETTER_EMAIL.ignore,
};

/** The stored fields, with the built-in wording where one is blank or missing. */
export function withDefaults(
  stored: Partial<Record<keyof NewsletterSettings, unknown>> | null | undefined,
): NewsletterSettings {
  const settings = { ...NEWSLETTER_DEFAULTS };
  if (!stored) return settings;
  for (const field of NEWSLETTER_FIELDS) {
    const value = stored[field];
    if (typeof value === "string" && value.trim() !== "")
      settings[field] = value.trim();
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
