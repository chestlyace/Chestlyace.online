import type { Lang } from "./index";

// The few words shared components need on every page (a link that opens a new tab,
// …), kept apart from the dictionaries so a client component can use them without
// downloading a whole dictionary (docs/i18n.md §4).
export const NEW_TAB: Record<Lang, string> = {
  en: "opens in a new tab",
  fr: "s’ouvre dans un nouvel onglet",
};
