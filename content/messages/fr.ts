import type { Messages } from "./en";

// The French dictionary (docs/i18n.md §4, §9): typed as the English shape, so a missing
// key does not compile. The voice is first person, with "vous" for the visitor.
export const fr: Messages = {
  language: {
    label: "Langue",
    names: { en: "English", fr: "Français" },
    switchTo: "Passer en {language}",
  },
};
