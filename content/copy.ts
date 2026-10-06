import type { SiteKey } from "@/lib/sites";

// PLACEHOLDER COPY — every string in this file is a stand-in written by the
// agent, not the owner's wording (design.md §13–14 mark each one). Replace them
// here; nothing else needs to change. Search for "PLACEHOLDER" to find the
// groups.

// PLACEHOLDER — one line under each site in the Sites menu (design.md §13.7).
export const SITE_MENU_DESCRIPTIONS: Record<SiteKey, string> = {
  main: "Software engineering",
  creatives: "Design and photography",
  blog: "Writing and notes",
};

// PLACEHOLDER — the one-line description in the footer's brand block
// (design.md §13.8, D26).
export const FOOTER_DESCRIPTIONS: Record<SiteKey, string> = {
  main: "Software engineer building fast, reliable products for the web.",
  creatives: "Design and photography by Chestly Ace.",
  blog: "Writing and notes from Chestly Ace.",
};
