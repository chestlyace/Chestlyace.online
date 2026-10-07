// Homepage section order, numbering, bands, and the header's active link
// (design.md §14.0).

export const HOME_SECTION_IDS = [
  "about",
  "skills",
  "services",
  "projects",
  "experience",
  "volunteering",
  "contact",
  "faq",
] as const;

export type HomeSectionId = (typeof HOME_SECTION_IDS)[number];

export type Band = "default" | "alt";

// Index numbers count the sections that are actually shown, so a hidden
// Volunteering leaves no gap: ["about", "skills"] → { about: "01", skills: "02" }.
export function sectionNumbers<T extends string>(
  shown: readonly T[],
): Record<T, string> {
  const numbers = {} as Record<T, string>;
  shown.forEach((id, index) => {
    numbers[id] = String(index + 1).padStart(2, "0");
  });
  return numbers;
}

// Bands alternate `background` and `background-alt`, counted up from the
// footer (which is `background-alt`): the last section is `default`, the one
// above it `alt`, and so on. No two neighbours match, whatever is hidden.
export function sectionBands<T extends string>(
  shown: readonly T[],
): Record<T, Band> {
  const bands = {} as Record<T, Band>;
  shown.forEach((id, index) => {
    const fromEnd = shown.length - 1 - index;
    bands[id] = fromEnd % 2 === 0 ? "default" : "alt";
  });
  return bands;
}

export type NavLinkId = "about" | "projects" | "experience" | "contact";

export type NavLink = { id: string; label: string; href: string };

// The main site's key links (design.md §13.6).
export const MAIN_NAV: readonly NavLink[] = [
  { id: "about", label: "About", href: "/#about" },
  { id: "projects", label: "Projects", href: "/#projects" },
  { id: "experience", label: "Experience", href: "/#experience" },
  { id: "contact", label: "Contact", href: "/#contact" },
];

// Sections without a nav link keep the previous link active (design.md §14.0).
const SECTION_NAV: Record<HomeSectionId, NavLinkId> = {
  about: "about",
  skills: "about",
  services: "about",
  projects: "projects",
  experience: "experience",
  volunteering: "experience",
  contact: "contact",
  faq: "contact",
};

export function activeNavLink(sectionId: string | null): NavLinkId | null {
  if (sectionId === null) return null;
  return Object.hasOwn(SECTION_NAV, sectionId)
    ? SECTION_NAV[sectionId as HomeSectionId]
    : null;
}
