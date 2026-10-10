import type { Lang } from "./index";

// Reading a row in a language (docs/i18n.md §5). A table's `translations` column holds
// `{ fr: { field: value, … } }`; for French each field whose value is present and not
// blank replaces the English one, anything missing falls back to English, field by
// field. Pure.

export type Translations = Partial<Record<Lang, Record<string, unknown>>>;

function present(value: unknown): boolean {
  if (typeof value === "string") return value.trim() !== "";
  if (Array.isArray(value)) return value.length > 0;
  return value !== undefined && value !== null;
}

/** The row with the French values applied for `fields`; the row itself for English. */
export function localize<T extends object, K extends keyof T>(
  row: T,
  lang: Lang,
  fields: readonly K[],
): T {
  if (lang === "en") return row;
  const over = (row as { translations?: Translations | null }).translations?.[
    lang
  ];
  if (!over) return row;
  const next = { ...row };
  for (const field of fields) {
    const value = over[field as string];
    if (present(value)) next[field] = value as T[K];
  }
  return next;
}

/**
 * For a list of objects that carry a French sibling key (`alt` / `altFr`,
 * `role` / `roleFr`, docs/i18n.md §5), the objects with the French value in place.
 */
export function localizeSiblings<T extends Record<string, unknown>>(
  items: readonly T[],
  lang: Lang,
  fields: readonly string[],
): T[] {
  if (lang === "en") return [...items];
  return items.map((item) => {
    const next: Record<string, unknown> = { ...item };
    for (const field of fields) {
      const value = item[`${field}Fr`];
      if (present(value)) next[field] = value;
    }
    return next as T;
  });
}
