"use client";

import { getMessages } from "@/content/messages";
import { useLang } from "./LangProvider";

// The 404 page of every public site. A client component: Next gives a not-found page
// no route params, so it reads the language from the layout's provider.
export function NotFoundMessage() {
  const lang = useLang();
  return (
    <div className="flex flex-1 items-center justify-center px-4 pt-32 pb-24">
      <p>{getMessages(lang).chrome.notFound}</p>
    </div>
  );
}
