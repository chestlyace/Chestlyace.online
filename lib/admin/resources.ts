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

export function findResource(id: string): Resource | undefined {
  return RESOURCES.find((resource) => resource.id === id);
}
