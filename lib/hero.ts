import { format } from "@/lib/i18n/format";

// Small pure helpers for the hero (design.md §14.1).

// "Software Engineer" → ["Software", "Engineer"]: the two big lines, split at
// the first space. A one-word headline is one line; extra words stay on line two.
export function splitHeadline(headline: string): string[] {
  const text = headline.trim().replace(/\s+/g, " ");
  if (!text) return [];
  const space = text.indexOf(" ");
  return space === -1 ? [text] : [text.slice(0, space), text.slice(space + 1)];
}

// What search engines and screen readers get instead of the decorative lines.
export function heroSrText(
  name: string,
  legalName: string | null,
  headline: string,
  alsoKnownAs = ", also known as {legalName}",
): string {
  const also =
    legalName && legalName !== name ? format(alsoKnownAs, { legalName }) : "";
  return `${name}${also} — ${headline.toLowerCase()}`;
}

export type ImageSource =
  | { kind: "local"; src: string }
  | { kind: "remote"; src: string }
  | { kind: "none" };

// profile.hero_image_url is a path under public/, a full URL (Cloudinary), or —
// from the old site — a bare file name served from the site root. Local files go
// through next/image; remote hosts are not configured for it, so they are shown
// as they are.
export function imageSource(url: string | null | undefined): ImageSource {
  const value = url?.trim();
  if (!value) return { kind: "none" };
  if (value.startsWith("//")) return { kind: "remote", src: `https:${value}` };
  if (/^https?:\/\//i.test(value)) return { kind: "remote", src: value };
  return { kind: "local", src: `/${value.replace(/^\/+/, "")}` };
}

// "+237 676 940 247" → "tel:+237676940247"
export function phoneHref(phone: string): string | null {
  const digits = phone.replace(/[^\d+]/g, "");
  return /\d/.test(digits) ? `tel:${digits}` : null;
}
