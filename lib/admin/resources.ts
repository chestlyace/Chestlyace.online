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
  /** What the screen's page title says under its name. */
  description: string;
  /** Singular, for "New project". */
  noun: string;
};

export const RESOURCES: readonly Resource[] = [
  {
    id: "profile",
    label: "Profile",
    href: "/profile",
    description: "Your name, headline, About text, résumé and contact details.",
    noun: "profile",
  },
  {
    id: "skills",
    label: "Skills",
    href: "/skills",
    description: "The languages, frameworks and tools shown as logos.",
    noun: "skill",
  },
  {
    id: "services",
    label: "Services",
    href: "/services",
    description: "The cards in the Services section.",
    noun: "service",
  },
  {
    id: "projects",
    label: "Projects",
    href: "/projects",
    description: "Projects on the home page and their own pages.",
    noun: "project",
  },
  {
    id: "experience",
    label: "Experience",
    href: "/experience",
    description: "Work and education, newest first.",
    noun: "entry",
  },
  {
    id: "volunteering",
    label: "Volunteering",
    href: "/volunteering",
    description: "Community and volunteer work.",
    noun: "entry",
  },
  {
    id: "certifications",
    label: "Certifications",
    href: "/certifications",
    description: "Badges and credentials under Skills.",
    noun: "certification",
  },
  {
    id: "socials",
    label: "Socials",
    href: "/socials",
    description: "Links to your profiles.",
    noun: "link",
  },
  {
    id: "faq",
    label: "FAQ",
    href: "/faq",
    description: "Questions and answers at the end of the page.",
    noun: "question",
  },
];

export function findResource(id: string): Resource | undefined {
  return RESOURCES.find((resource) => resource.id === id);
}
