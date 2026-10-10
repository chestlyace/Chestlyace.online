"use client";

import { X } from "lucide-react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { langCookie, prefersFrench, readLangCookie } from "@/lib/i18n/cookie";
import { stripSitePrefix, switchPath } from "@/lib/i18n";
import { Container } from "./Container";

// The French suggestion (design.md §13.62): a slim line under the header on an English
// page, for a browser whose first language is French and who has not chosen or
// dismissed yet. It is drawn after the page loads (the pages stay static), and its words
// are in French because they are for the person who reads French.
export type SuggestionLabels = {
  region: string;
  text: string;
  link: string;
  close: string;
};

const EVENT = "lang:changed";

function subscribe(callback: () => void) {
  window.addEventListener(EVENT, callback);
  return () => window.removeEventListener(EVENT, callback);
}

// "show" only for a French browser with no choice remembered; the server renders nothing.
function snapshot(): string {
  return readLangCookie(document.cookie) === null &&
    prefersFrench(navigator.languages)
    ? "show"
    : "hide";
}

export function LanguageSuggestion({ labels }: { labels: SuggestionLabels }) {
  const pathname = stripSitePrefix(usePathname());
  const state = useSyncExternalStore(subscribe, snapshot, () => "hide");
  if (state !== "show") return null;

  const dismiss = (language: "en" | "fr") => {
    document.cookie = langCookie(language, window.location.hostname);
    window.dispatchEvent(new Event(EVENT));
  };

  return (
    <div
      role="region"
      aria-label={labels.region}
      lang="fr"
      className="animate-[lang-suggestion_150ms_ease-out] bg-background-alt pt-[4.5rem] motion-reduce:animate-none"
    >
      <Container className="flex min-h-10 items-center justify-between gap-3 py-2 text-sm text-foreground">
        <p className="min-w-0">
          {labels.text}{" "}
          <NextLink
            href={switchPath(pathname, "fr")}
            hrefLang="fr"
            onClick={() => dismiss("fr")}
            className="link-inline font-medium"
          >
            {labels.link}
          </NextLink>
        </p>
        <button
          type="button"
          aria-label={labels.close}
          onClick={() => dismiss("en")}
          className="-mr-2 grid size-11 shrink-0 place-items-center rounded-full text-muted transition-colors duration-150 hover:bg-tile hover:text-foreground"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </Container>
    </div>
  );
}
