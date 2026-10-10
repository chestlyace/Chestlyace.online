import type { NavLink } from "@/lib/sections";

// The creatives site's key links (design.md §14.25).
export const CREATIVES_NAV: readonly NavLink[] = [
  { id: "work", label: "Work", href: "/" },
  { id: "design", label: "Design", href: "/design" },
  { id: "photography", label: "Photography", href: "/photography" },
  { id: "services", label: "Services", href: "/services" },
];

// The link of the route being shown (the home page is Work).
export function creativesActiveLink(pathname: string): string | null {
  if (pathname === "/") return "work";
  if (pathname === "/design" || pathname.startsWith("/design/"))
    return "design";
  if (pathname === "/photography" || pathname.startsWith("/photography/"))
    return "photography";
  if (pathname === "/services") return "services";
  return null;
}
