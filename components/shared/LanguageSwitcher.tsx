"use client";

import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { langCookie } from "@/lib/i18n/cookie";
import { LANGS, switchPath, type Lang } from "@/lib/i18n";
import { cn } from "@/lib/cn";
import { useLang } from "./LangProvider";

export type LanguageLabels = {
  /** The nav's accessible name ("Language"). */
  nav: string;
  /** The name of each language, in itself ("English", "Français"). */
  names: Record<Lang, string>;
  /** "Switch to {language}" with the placeholder already filled per language. */
  switchTo: Record<Lang, string>;
};

// The language switcher (design.md §13.62): EN and FR as mono labels, the current one
// in the foreground with the nav's dot under it, the other a plain link to the same
// page in that language. It remembers the choice in the `lang` cookie and never
// redirects anyone.
export function LanguageSwitcher({
  labels,
  className,
}: {
  labels: LanguageLabels;
  className?: string;
}) {
  const current = useLang();
  const pathname = usePathname();

  return (
    <nav aria-label={labels.nav} className={className}>
      <ul className="flex items-center gap-2">
        {LANGS.map((code) => {
          const active = code === current;
          return (
            <li key={code}>
              {active ? (
                <span
                  lang={code}
                  aria-current="true"
                  title={labels.names[code]}
                  className="type-label relative inline-flex h-11 items-center px-2 text-foreground"
                >
                  {code.toUpperCase()}
                  <span
                    aria-hidden="true"
                    className="absolute bottom-2 left-1/2 size-1 -translate-x-1/2 rounded-full bg-primary"
                  />
                </span>
              ) : (
                <NextLink
                  href={switchPath(pathname, code)}
                  lang={code}
                  hrefLang={code}
                  title={labels.names[code]}
                  aria-label={labels.switchTo[code]}
                  onClick={() => {
                    document.cookie = langCookie(
                      code,
                      window.location.hostname,
                    );
                  }}
                  className={cn(
                    "type-label inline-flex h-11 items-center px-2 text-muted transition-colors duration-150 hover:text-foreground focus-visible:text-foreground",
                  )}
                >
                  {code.toUpperCase()}
                </NextLink>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
