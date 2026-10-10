// The English dictionary (docs/i18n.md §4): the source of the message shape. Every
// string a visitor reads that is written in code moves here from `content/copy.ts` and
// the components, step by step (Phase 11b.2 onwards); `fr.ts` must have the same keys,
// which the type enforces and `messages.test.ts` checks. Placeholders are `{name}`.
export const en = {
  language: {
    label: "Language",
    /** The name of each language, in itself. */
    names: { en: "English", fr: "Français" },
    /** The switcher's accessible name for a language, e.g. "Switch to Français". */
    switchTo: "Switch to {language}",
  },
};

export type Messages = typeof en;
