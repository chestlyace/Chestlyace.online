import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GalleryImage } from "@/components/project/GalleryImage";
import { NextProject } from "@/components/project/NextProject";
import { ProjectBackLink } from "@/components/project/ProjectBackLink";
import { ProjectHero } from "@/components/project/ProjectHero";
import { Button } from "@/components/shared/Button";
import { Container } from "@/components/shared/Container";
import { Reveal } from "@/components/shared/Reveal";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { Tag } from "@/components/shared/Tag";
import { splitParagraphs } from "@/lib/about";
import { imageSource } from "@/lib/hero";
import { isHttpUrl } from "@/lib/links";
import { getCachedProject, getCachedProjectSlugs } from "@/lib/portfolio";
import { caseStudyRows, galleryUrls, projectLinks } from "@/lib/projectPage";

export async function generateStaticParams() {
  return (await getCachedProjectSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/sites/main/projects/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const data = await getCachedProject(slug);
  if (!data) return {};
  return {
    title: `${data.project.title} — Chestly Ace`,
    description: data.project.summary,
  };
}

// A project's case study (design.md §14.10): title, facts, the hero image (the
// card's image, morphed), the summary, Problem / Approach / Outcome, a gallery,
// and a link to the next project.
export default async function ProjectPage({
  params,
}: PageProps<"/sites/main/projects/[slug]">) {
  const { slug } = await params;
  const data = await getCachedProject(slug);
  if (!data) notFound();
  const { project, next } = data;

  const image = imageSource(project.imageUrl);
  const rows = caseStudyRows(project);
  const gallery = galleryUrls(project.galleryUrls);
  const links = projectLinks(project).filter(
    (link) => link.kind === "private" || isHttpUrl(link.href),
  );

  return (
    <>
      <Container className="pt-28 pb-24 md:pb-32">
        <ProjectBackLink
          slug={project.slug}
          imageSrc={image.kind === "none" ? null : image.src}
        />

        <SectionHeading
          as="h1"
          title={project.title}
          className="mt-10 max-w-none md:mt-12"
        />

        <div
          data-morph-follow
          className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between"
        >
          <div className="flex flex-col gap-4">
            {project.categoryLabel && (
              <p className="type-label text-muted">{project.categoryLabel}</p>
            )}
            {project.techStack.length > 0 && (
              <ul aria-label="Built with" className="flex flex-wrap gap-2">
                {project.techStack.map((tech) => (
                  <li key={tech}>
                    <Tag>{tech}</Tag>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {links.length > 0 && (
            <div className="flex flex-wrap items-center gap-3">
              {links.map((link) =>
                link.kind === "link" ? (
                  <Button
                    key={link.label}
                    href={link.href}
                    external
                    variant="secondary"
                    trailingIcon={<ArrowUpRight />}
                    iconNudge="up-right"
                  >
                    {link.label}
                  </Button>
                ) : (
                  <Tag key={link.label} className="h-9 px-4">
                    {link.label} · Private
                  </Tag>
                ),
              )}
            </div>
          )}
        </div>

        <div className="mt-10 md:mt-12">
          <ProjectHero
            slug={project.slug}
            title={project.title}
            image={image}
          />
        </div>

        <Reveal className="mt-16 max-w-[980px]">
          <p data-reveal className="text-lead text-foreground">
            {project.summary}
          </p>
        </Reveal>

        {rows.length > 0 && (
          <Reveal
            className="mt-16 border-t border-border md:mt-24"
            stagger={0.1}
          >
            {rows.map((row) => (
              <section
                key={row.label}
                data-reveal
                aria-label={row.label}
                className="grid gap-4 border-b border-border py-12 md:grid-cols-12 md:gap-8"
              >
                <h2 className="type-label text-muted md:col-span-3">
                  {row.label}
                </h2>
                <div className="flex max-w-[68ch] flex-col gap-4 text-body text-foreground md:col-span-9">
                  {splitParagraphs(row.text).map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}
          </Reveal>
        )}

        {gallery.length > 0 && (
          <ul
            aria-label="Gallery"
            className="mt-16 flex flex-col gap-6 md:mt-24"
          >
            {gallery.map((url, i) => (
              <li key={url}>
                <GalleryImage
                  image={imageSource(url)}
                  alt={`${project.title} — screenshot ${i + 1}`}
                />
              </li>
            ))}
          </ul>
        )}
      </Container>

      {next && <NextProject next={next} />}
    </>
  );
}
