import type { NavLink } from "@/lib/sections";

// The creatives site's key links (design.md §14.25), added as each page is built:
// Work follows with the home page (10b.6–10b.7).
export const CREATIVES_NAV: readonly NavLink[] = [
  { id: "design", label: "Design", href: "/design" },
  { id: "photography", label: "Photography", href: "/photography" },
  { id: "services", label: "Services", href: "/services" },
];

// The link of the route being shown: Design on the gallery.
export function creativesActiveLink(pathname: string): string | null {
  if (pathname === "/design" || pathname.startsWith("/design/"))
    return "design";
  if (pathname === "/photography" || pathname.startsWith("/photography/"))
    return "photography";
  if (pathname === "/services") return "services";
  return null;
}
