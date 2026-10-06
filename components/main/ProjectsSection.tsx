import { SectionHeading } from "@/components/shared/SectionHeading";
import type { HomepageData } from "@/lib/db";
import { rightColumnFlags } from "@/lib/projects";
import type { Band } from "@/lib/sections";
import { ProjectCard } from "./ProjectCard";
import { ProjectsGrid } from "./ProjectsGrid";
import { Section } from "./Section";

// Projects (design.md §14.5): featured projects each get a full-width row, then
// a two-column grid whose right column sits 96px lower, so tiles step down the
// page. One column on phones.
export function ProjectsSection({
  projects,
  index,
  band,
}: {
  projects: HomepageData["projects"];
  index: string;
  band: Band;
}) {
  const offsets = rightColumnFlags(
    projects.map((project) => project.isFeatured),
  );

  return (
    <Section id="projects" band={band}>
      <SectionHeading index={index} label="Projects" title="Projects" />
      <ProjectsGrid className="mt-12 grid gap-12 md:mt-16 md:grid-cols-2 md:gap-x-8 md:gap-y-16 md:pb-24">
        {projects.map((project, i) => (
          <ProjectCard
            key={project.id}
            project={project}
            featured={project.isFeatured}
            offset={offsets[i]}
          />
        ))}
      </ProjectsGrid>
    </Section>
  );
}
