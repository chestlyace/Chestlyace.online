"use client";

import NextLink from "next/link";
import type { ComponentProps } from "react";
import { LinkPending } from "@/components/shared/LinkPending";

// `next/link` for the admin: it tells the navigation bar and veil (design.md §13.64) when
// its navigation is in flight. The admin has no language prefix, so nothing else changes.
export function AdminLink({
  children,
  ...props
}: ComponentProps<typeof NextLink>) {
  return (
    <NextLink {...props}>
      {children}
      <LinkPending />
    </NextLink>
  );
}
