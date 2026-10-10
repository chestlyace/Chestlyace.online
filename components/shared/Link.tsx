"use client";

import NextLink from "next/link";
import type { ComponentProps } from "react";
import { localizeHref } from "@/lib/i18n";
import { useLang } from "./LangProvider";
import { LinkPending } from "./LinkPending";

// `next/link` that keeps the visitor in their language (docs/i18n.md §3): a path to
// another page of the site gets the language's prefix (`/projects/x` → `/fr/projects/x`
// on a French page); external addresses, files and bare `#hash` links are left alone.
export function Link({
  href,
  children,
  ...props
}: ComponentProps<typeof NextLink>) {
  const lang = useLang();
  return (
    <NextLink
      href={typeof href === "string" ? localizeHref(href, lang) : href}
      {...props}
    >
      {children}
      <LinkPending />
    </NextLink>
  );
}
