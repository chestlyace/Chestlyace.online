import { format } from "@/lib/i18n/format";

// The contact form (design.md §13.15, §14.8): its fields, their checks, and the
// links built from the visitor's message. Pure functions, shared by the form
// (checks as the visitor types) and the API route (checks again, because the
// browser can't be trusted).

export const SUBJECTS = [
  "General Inquiry",
  "Web Development Project",
  "Job Opportunity",
  "Collaboration",
] as const;

export type ContactField = "name" | "email" | "subject" | "message";

export type ContactValues = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

export const LIMITS = {
  name: 100,
  email: 200,
  messageMin: 10,
  message: 5000,
} as const;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// The message for one field, or null when it is fine. Whitespace around a value
// is ignored.
export type ContactErrorMessages = {
  nameRequired: string;
  nameTooLong: string;
  emailRequired: string;
  emailInvalid: string;
  subjectInvalid: string;
  messageRequired: string;
  messageShort: string;
  messageLong: string;
};

// The messages are passed in (docs/i18n.md §4): the form shows them in the page's
// language, the server checks with the English ones.
export function fieldError(
  field: ContactField,
  raw: string,
  messages: ContactErrorMessages,
): string | null {
  const value = raw.trim();
  switch (field) {
    case "name":
      if (!value) return messages.nameRequired;
      if (value.length > LIMITS.name) return messages.nameTooLong;
      return null;
    case "email":
      if (!value) return messages.emailRequired;
      if (value.length > LIMITS.email || !EMAIL.test(value))
        return messages.emailInvalid;
      return null;
    case "subject":
      return (SUBJECTS as readonly string[]).includes(value)
        ? null
        : messages.subjectInvalid;
    case "message":
      if (!value) return messages.messageRequired;
      if (value.length < LIMITS.messageMin) return messages.messageShort;
      if (value.length > LIMITS.message) return messages.messageLong;
      return null;
  }
}

export const CONTACT_FIELDS: readonly ContactField[] = [
  "name",
  "email",
  "subject",
  "message",
];

export type ContactErrors = Partial<Record<ContactField, string>>;

// Checks every field of an unknown value (a parsed request body).
export function validateContact(
  input: unknown,
  messages: ContactErrorMessages,
): { ok: true; values: ContactValues } | { ok: false; errors: ContactErrors } {
  const source =
    typeof input === "object" && input !== null
      ? (input as Record<string, unknown>)
      : {};
  const values = {} as ContactValues;
  const errors: ContactErrors = {};
  for (const field of CONTACT_FIELDS) {
    const raw = typeof source[field] === "string" ? source[field] : "";
    const error = fieldError(field, raw, messages);
    if (error) errors[field] = error;
    values[field] = raw.trim();
  }
  return Object.keys(errors).length === 0
    ? { ok: true, values }
    : { ok: false, errors };
}

// Spam checks that cost a real visitor nothing: a hidden field people never
// see (bots fill it) and a minimum time on the form (bots submit instantly).
export const MIN_FORM_SECONDS = 3;

export function looksLikeBot(input: {
  website?: unknown;
  elapsedMs?: unknown;
}): "honeypot" | "too-fast" | null {
  if (typeof input.website === "string" && input.website.trim() !== "")
    return "honeypot";
  const elapsed = Number(input.elapsedMs);
  // The form waits out MIN_FORM_SECONDS itself; the server allows some slack.
  if (!Number.isFinite(elapsed) || elapsed < (MIN_FORM_SECONDS - 0.5) * 1000)
    return "too-fast";
  return null;
}

// "237676940247" or "+237 676 940 247" → "237676940247"
export function whatsappDigits(number: string): string | null {
  const digits = number.replace(/\D/g, "");
  return digits.length >= 6 ? digits : null;
}

// https://wa.me/<number>, with the text prefilled when there is some.
export function whatsappHref(number: string, text?: string): string | null {
  const digits = whatsappDigits(number);
  if (!digits) return null;
  const query = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${digits}${query}`;
}

// What "Continue on WhatsApp" opens with after a message was emailed.
export function whatsappText(
  values: ContactValues,
  template = "Hi Chestly, it's {name}. {subject}: {message}",
): string {
  return format(template, values);
}

// "+237 676 940 247" → "+237 676 940 247" (as stored); "237676940247" → "+237676940247".
export function displayPhone(phone: string): string {
  const trimmed = phone.trim();
  return /^\d+$/.test(trimmed) ? `+${trimmed}` : trimmed;
}
