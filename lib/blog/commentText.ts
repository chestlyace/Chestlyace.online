// A comment is plain text (design.md §13.37): line breaks are kept, web addresses
// become links, and nothing is ever rendered as HTML. This only works out the
// pieces; the component draws them (as text nodes and links, never raw HTML).

export type Piece =
  { type: "text"; text: string } | { type: "link"; href: string; text: string };

const URL_PATTERN = /\bhttps?:\/\/[^\s<>"']+/gi;

export function pieces(body: string): Piece[] {
  const out: Piece[] = [];
  let last = 0;
  for (const match of body.matchAll(URL_PATTERN)) {
    let url = match[0];
    // A full stop or bracket at the end of a sentence isn't part of the address.
    const trimmed = url.replace(/[.,;:!?)\]]+$/, "");
    const index = match.index ?? 0;
    if (index > last) out.push({ type: "text", text: body.slice(last, index) });
    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol === "http:" || parsed.protocol === "https:") {
        out.push({ type: "link", href: parsed.toString(), text: trimmed });
        url = trimmed;
      } else out.push({ type: "text", text: match[0] });
    } catch {
      out.push({ type: "text", text: match[0] });
    }
    last = index + url.length;
  }
  if (last < body.length) out.push({ type: "text", text: body.slice(last) });
  return out;
}

export const countWords = (text: string) =>
  text.split(/\s+/).filter(Boolean).length;

/** A comment's words as one comparable line, for spotting a repeat. */
export const normalise = (text: string) =>
  text.toLowerCase().replace(/\s+/g, " ").trim();

export const DEFAULT_MAX_WORDS = 120;

export function maxWords(
  env: Record<string, string | undefined> = process.env,
): number {
  const value = Number(env.COMMENT_MAX_WORDS);
  return Number.isInteger(value) && value > 0 && value <= 2000
    ? value
    : DEFAULT_MAX_WORDS;
}
