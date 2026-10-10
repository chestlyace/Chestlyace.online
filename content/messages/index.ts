import type { Lang } from "@/lib/i18n";
import { en, type Messages } from "./en";
import { fr } from "./fr";

export type { Messages } from "./en";

const DICTIONARIES: Record<Lang, Messages> = { en, fr };

/** The dictionary of a language. A client component gets the strings it needs as props. */
export function getMessages(lang: Lang): Messages {
  return DICTIONARIES[lang];
}
