import { LOCALES, type Lang } from "./index";

// Filling a message's `{name}` placeholders, and choosing a plural form
// (docs/i18n.md §4). Pure; no library.

export function format(
  message: string,
  values: Record<string, string | number> = {},
): string {
  return message.replace(/\{(\w+)\}/g, (whole, name: string) =>
    Object.hasOwn(values, name) ? String(values[name]) : whole,
  );
}

export type PluralForms = Partial<Record<Intl.LDMLPluralRule, string>> & {
  other: string;
};

/** The form of a plural message that `count` takes in `lang` (`{count}` is filled). */
export function plural(forms: PluralForms, count: number, lang: Lang): string {
  const rule = new Intl.PluralRules(LOCALES[lang]).select(count);
  return format(forms[rule] ?? forms.other, { count });
}
