// The things the admin edits (design.md §13.18, §14.11): one entry per nav link,
// dashboard tile and list screen.

export type ResourceId =
  | "profile"
  | "skills"
  | "services"
  | "projects"
  | "experience"
  | "volunteering"
  | "certifications"
  | "socials"
  | "faq";

export type Resource = {
  id: ResourceId;
  label: string;
  /** Address on the admin host. */
  href: string;
  /** Name in `/api/admin/<api>` (content-schema.md §2). */
  api: string;
  /** What the screen's page title says under its name. */
  description: string;
  /** Singular, for "New project". */
  noun: string;
};

export const RESOURCES: readonly Resource[] = [
  {
    id: "profile",
    api: "profile",
    label: "Profile",
    href: "/profile",
    description: "Your name, headline, About text, résumé and contact details.",
    noun: "profile",
  },
  {
    id: "skills",
    api: "skills",
    label: "Skills",
    href: "/skills",
    description: "The languages, frameworks and tools shown as logos.",
    noun: "skill",
  },
  {
    id: "services",
    api: "services",
    label: "Services",
    href: "/services",
    description: "The cards in the Services section.",
    noun: "service",
  },
  {
    id: "projects",
    api: "projects",
    label: "Projects",
    href: "/projects",
    description: "Projects on the home page and their own pages.",
    noun: "project",
  },
  {
    id: "experience",
    api: "journey",
    label: "Experience",
    href: "/experience",
    description: "Work and education, newest first.",
    noun: "entry",
  },
  {
    id: "volunteering",
    api: "volunteering",
    label: "Volunteering",
    href: "/volunteering",
    description: "Community and volunteer work.",
    noun: "entry",
  },
  {
    id: "certifications",
    api: "certifications",
    label: "Certifications",
    href: "/certifications",
    description: "Badges and credentials under Skills.",
    noun: "certification",
  },
  {
    id: "socials",
    api: "socials",
    label: "Socials",
    href: "/socials",
    description: "Links to your profiles.",
    noun: "link",
  },
  {
    id: "faq",
    api: "faqs",
    label: "FAQ",
    href: "/faq",
    description: "Questions and answers at the end of the page.",
    noun: "question",
  },
];

// Blog settings that are not a list of entries: one screen of its own in the
// Blog group (design.md §14.19), edited like the profile.
export type SettingsResource = Omit<Resource, "id"> & { id: "newsletter" };

export const NEWSLETTER_RESOURCE: SettingsResource = {
  id: "newsletter",
  api: "newsletter",
  label: "Newsletter",
  href: "/blog/newsletter",
  description:
    "The signup box, the pages the confirmation link opens, and the confirmation email.",
  noun: "newsletter",
};

// The creatives site's screens (design.md §14.26), a Creatives group of the sidebar:
// kept apart from RESOURCES, which is the main site's content (nav, dashboard).
export type CreativesId =
  | "design"
  | "photography"
  | "creative-services"
  | "creative-faqs"
  | "creatives-settings";

export type AdminResource = Omit<Resource, "id"> & { id: string };

export const CREATIVES_RESOURCES: readonly (Omit<Resource, "id"> & {
  id: CreativesId;
})[] = [
  {
    id: "design",
    api: "design-pieces",
    label: "Design",
    href: "/creatives/design",
    description: "The graphic design pieces in the gallery.",
    noun: "piece",
  },
  {
    id: "photography",
    api: "photo-events",
    label: "Photography",
    href: "/creatives/photography",
    description:
      "Events, with their pictures, credits and a link to the album.",
    noun: "event",
  },
  {
    id: "creative-services",
    api: "creative-services",
    label: "Services",
    href: "/creatives/services",
    description: "What you offer in design and photography.",
    noun: "service",
  },
  {
    id: "creative-faqs",
    api: "creative-faqs",
    label: "Questions",
    href: "/creatives/faq",
    description: "Questions and answers on the services page.",
    noun: "question",
  },
  {
    id: "creatives-settings",
    api: "creatives-settings",
    label: "Settings",
    href: "/creatives/settings",
    description:
      "The home page's statement, the section intros, the marquee and the contact block.",
    noun: "settings",
  },
];

export function findResource(id: string): Resource | undefined {
  return RESOURCES.find((resource) => resource.id === id);
}

// What the editor form can edit: a content resource or the newsletter screen.
export function findEditable(id: string): AdminResource | undefined {
  if (id === NEWSLETTER_RESOURCE.id) return NEWSLETTER_RESOURCE;
  return (
    findResource(id) ??
    CREATIVES_RESOURCES.find((resource) => resource.id === id)
  );
}
