import { countWords } from "./commentText";

// The checks on draft feedback (design.md §13.69, D93): pure, so the form checks as
// the reader types and the server checks again with the same rules.

export const FEEDBACK_NAME_MAX = 80;
export const DEFAULT_FEEDBACK_MAX_WORDS = 300;

/** The word limit: `DRAFT_FEEDBACK_MAX_WORDS` when it is a sensible number, else 300. */
export function feedbackMaxWords(
  env: Record<string, string | undefined> = process.env,
): number {
  const value = Number(env.DRAFT_FEEDBACK_MAX_WORDS);
  return Number.isInteger(value) && value > 0 && value <= 5000
    ? value
    : DEFAULT_FEEDBACK_MAX_WORDS;
}

export type FeedbackFieldError =
  "name-required" | "name-long" | "body-required" | "body-long";

/** What is wrong with each field, by code (the form words them in its language). */
export function feedbackErrors(
  input: { name: string; body: string },
  maxWords: number,
): Partial<Record<"name" | "body", FeedbackFieldError>> {
  const errors: Partial<Record<"name" | "body", FeedbackFieldError>> = {};
  const name = input.name.trim();
  const body = input.body.trim();
  if (!name) errors.name = "name-required";
  else if (name.length > FEEDBACK_NAME_MAX) errors.name = "name-long";
  if (!body) errors.body = "body-required";
  else if (countWords(body) > maxWords) errors.body = "body-long";
  return errors;
}
