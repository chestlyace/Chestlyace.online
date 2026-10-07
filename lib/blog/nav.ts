import type { NavLink } from "@/lib/sections";

// The blog's key links (design.md §14.17).
export const BLOG_NAV: readonly NavLink[] = [
  { id: "posts", label: "Posts", href: "/" },
  { id: "tags", label: "Tags", href: "/tags" },
];

// Posts is active on the home and on post pages, Tags on the tags pages; the
// privacy and newsletter pages belong to neither.
export function blogActiveLink(pathname: string): string | null {
  if (pathname === "/tags" || pathname.startsWith("/tags/")) return "tags";
  if (pathname === "/privacy" || pathname.startsWith("/newsletter"))
    return null;
  return "posts";
}
