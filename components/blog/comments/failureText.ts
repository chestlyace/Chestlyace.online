import type { Messages } from "@/content/messages";
import { format } from "@/lib/i18n/format";

// What the comments API sends back when a write fails: a status, and for a refused
// comment a `code` (lib/blog/comments.ts) the page words in its own language. The
// API's English `message` is only the fallback for a code the page does not know.
export type Failure = {
  code?: string;
  message?: string;
  values?: Record<string, number>;
};

type Text = Messages["blog"]["comments"];

const CODES: Record<string, keyof Text["invalid"]> = {
  empty: "empty",
  "too-long": "tooLong",
  "too-many-words": "tooManyWords",
  "no-parent": "noParent",
  duplicate: "duplicate",
  "own-comment": "ownComment",
};

export function failureText(
  text: Text,
  failure: Failure,
  status: number,
): string {
  const known = failure.code ? CODES[failure.code] : undefined;
  if (known) return format(text.invalid[known], failure.values);
  if (failure.message) return failure.message;
  return status === 401
    ? text.signInEnded
    : status === 403
      ? text.forbidden
      : status === 429
        ? text.slowDown
        : text.failed;
}
