"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { activeNavLink, type NavLinkId } from "@/lib/sections";

// The nav link whose section is in view (design.md §14.0). A thin band around
// the middle of the viewport decides; above the first section nothing is
// active. Sections are the `<section id>` elements on the page.
export function useActiveNavLink(): NavLinkId | null {
  const pathname = usePathname();
  // Keyed by path, so a link never stays active after navigating away.
  const [state, setState] = useState<{
    path: string;
    id: NavLinkId | null;
  } | null>(null);

  useEffect(() => {
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>("main section[id]"),
    );
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const hit = entries.filter((entry) => entry.isIntersecting).at(-1);
        if (hit) {
          setState({ path: pathname, id: activeNavLink(hit.target.id) });
        } else if (
          sections[0].getBoundingClientRect().top >
          window.innerHeight * 0.55
        ) {
          setState({ path: pathname, id: null });
        }
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [pathname]);

  return state?.path === pathname ? state.id : null;
}
