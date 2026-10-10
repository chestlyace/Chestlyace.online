import { getMessages } from "@/content/messages";
import { format } from "./format";
import { LANGS, type Lang } from "./index";

/** The switcher's words in the page's language (the accessible names, per language). */
export function languageLabels(lang: Lang) {
  const m = getMessages(lang).language;
  return {
    nav: m.label,
    names: m.names,
    switchTo: Object.fromEntries(
      LANGS.map((code) => [
        code,
        format(m.switchTo, { language: m.names[code] }),
      ]),
    ) as Record<Lang, string>,
  };
}
