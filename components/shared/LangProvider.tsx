"use client";

import { createContext, useContext, type ReactNode } from "react";
import { DEFAULT_LANG, type Lang } from "@/lib/i18n";

// The language of the page being shown (docs/i18n.md §3), set once in the site's
// layout for the chrome (header, footer, particle wordmark) and other client
// components that need to build a link or pick a word.
const LangContext = createContext<Lang>(DEFAULT_LANG);

export function LangProvider({
  lang,
  children,
}: {
  lang: Lang;
  children: ReactNode;
}) {
  return <LangContext.Provider value={lang}>{children}</LangContext.Provider>;
}

export function useLang(): Lang {
  return useContext(LangContext);
}
