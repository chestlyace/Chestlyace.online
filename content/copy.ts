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

// PLACEHOLDER — the hero's tagline under the headline (design.md §14.1). The old
// one named design and photography; this is software only.
export const HERO_TAGLINE =
  "Software engineer crafting modern digital experiences.";

// PLACEHOLDER — the hero's paragraph. The names come from the profile.
export function heroIntro(name: string, legalName: string | null): string {
  const who =
    legalName && legalName !== name
      ? `${legalName}, known professionally as ${name},`
      : name;
  return `${who} builds fast, reliable websites and web applications.`;
}

// PLACEHOLDER — the speech-bubble quote card next to the portrait. The old text
// was "Chill and relax, it's the weekend. Not you devs & designers, go complete
// your client's projects."; "& designers" is dropped (software only).
export const HERO_QUOTE = {
  handle: "@Dev.Ace",
  text: "Chill and relax, it's the weekend. Not you devs, go complete your client's projects.",
};
