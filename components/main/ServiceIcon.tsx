"use client";

import * as iconly from "react-iconly";

// react-iconly uses React context, so it can only be used from client code.
// `name` is services.icon from the database: an Iconly icon name such as
// "Category" (design.md §6, Iconly Light). Anything else shows "Category".
const NOT_ICONS = new Set(["Iconly", "IconlyProvider", "useIconlyTheme"]);

export function ServiceIcon({
  name,
  size = 40,
}: {
  name: string;
  size?: number;
}) {
  const known =
    /^[A-Z][A-Za-z0-9]*$/.test(name) &&
    !NOT_ICONS.has(name) &&
    Object.hasOwn(iconly, name);
  const Icon = (
    known
      ? (iconly as unknown as Record<string, typeof iconly.Category>)[name]
      : iconly.Category
  ) as typeof iconly.Category;
  return <Icon set="light" primaryColor="currentColor" size={size} />;
}
