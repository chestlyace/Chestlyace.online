import { ArrowRight } from "lucide-react";
import { Button } from "@/components/shared/Button";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { getMessages } from "@/content/messages";
import type { Lang } from "@/lib/i18n";
import type { HomepageData } from "@/lib/db";
import { homeProjects, rightColumnFlags } from "@/lib/projects";
import type { Band } from "@/lib/sections";
import { ProjectCard } from "./ProjectCard";
import { ProjectsGrid } from "./ProjectsGrid";
import { Section } from "./Section";

// Projects (design.md §14.5): featured projects each get a full-width row, then
// a two-column grid whose right column sits 96px lower, so tiles step down the
// page. One column on phones.
//
// On the home page only the first two are shown, with a "View all projects" button to
// the Projects page (`all`), which shows every project in the same grid.
export function ProjectsSection({
  lang,
  projects: everything,
  index,
  band,
  all = false,
}: {
  lang: Lang;
  projects: HomepageData["projects"];
  index?: string;
  band: Band;
  /** The Projects page: every project, its title the page's `h1`, no button. */
  all?: boolean;
}) {
  const m = getMessages(lang);
  const projects = all ? everything : homeProjects(everything);
  const offsets = rightColumnFlags(
    projects.map((project) => project.isFeatured),
  );

  return (
    <Section
      id="projects"
      legacyId={all ? undefined : "work"}
      band={band}
      className={all ? "pt-36 md:pt-48" : undefined}
    >
      <SectionHeading
        index={index}
        label={m.home.projects.label}
        title={m.home.projects.title}
        as={all ? "h1" : "h2"}
      />
      <ProjectsGrid className="mt-12 grid gap-12 md:mt-16 md:grid-cols-2 md:gap-x-8 md:gap-y-16 md:pb-24">
        {projects.map((project, i) => (
          <ProjectCard
            key={project.id}
            project={project}
            featured={project.isFeatured}
            offset={offsets[i]}
            viewLabel={m.home.projects.view}
          />
        ))}
      </ProjectsGrid>
      {!all && (
        <div className="mt-12 flex md:mt-0">
          <Button
            href="/projects"
            variant="secondary"
            size="lg"
            trailingIcon={<ArrowRight />}
            className="w-full sm:w-auto"
          >
            {m.home.projects.viewAll}
          </Button>
        </div>
      )}
    </Section>
  );
}
