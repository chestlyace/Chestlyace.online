"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Messages } from "@/content/messages";
import type { Lang } from "@/lib/i18n";

// The comments' words in the page's language (docs/i18n.md §4): the post page hands
// `blog.comments` and `blog.signIn` to <Comments>, which provides them to everything
// under it, so no component has to carry the strings down by hand.
type Value = {
  lang: Lang;
  text: Messages["blog"]["comments"];
  signIn: Messages["blog"]["signIn"];
};

const CommentsTextContext = createContext<Value | null>(null);

export function CommentsTextProvider({
  value,
  children,
}: {
  value: Value;
  children: ReactNode;
}) {
  return (
    <CommentsTextContext.Provider value={value}>
      {children}
    </CommentsTextContext.Provider>
  );
}

export function useCommentsText(): Value {
  const value = useContext(CommentsTextContext);
  if (!value) throw new Error("CommentsTextProvider is missing");
  return value;
}
