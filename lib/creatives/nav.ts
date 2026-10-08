import type { NavLink } from "@/lib/sections";

// The creatives site's key links (design.md §14.25), added as each page is built:
// Work and Services follow with their steps (10b.5–10b.7).
export const CREATIVES_NAV: readonly NavLink[] = [
  { id: "design", label: "Design", href: "/design" },
  { id: "photography", label: "Photography", href: "/photography" },
];

// The link of the route being shown: Design on the gallery.
export function creativesActiveLink(pathname: string): string | null {
  if (pathname === "/design" || pathname.startsWith("/design/"))
    return "design";
  if (pathname === "/photography" || pathname.startsWith("/photography/"))
    return "photography";
  return null;
}
