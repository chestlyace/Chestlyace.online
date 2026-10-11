import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectsSection } from "@/components/main/ProjectsSection";
import { getMessages } from "@/content/messages";
import { isLang } from "@/lib/i18n";
import { format } from "@/lib/i18n/format";
import { getCachedHomepageData } from "@/lib/portfolio";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/sites/main/[lang]/projects">): Promise<Metadata> {
  const { lang: raw } = await params;
  const lang = isLang(raw) ? raw : "en";
  const seo = getMessages(lang).seo.projects;
  const { profile } = await getCachedHomepageData(lang);
  return pageMetadata("main", {
    path: "/projects",
    lang,
    title: seo.title,
    description: format(seo.description, {
      name: profile?.displayName ?? "Chestly Ace",
    }),
  });
}

// Every published project, in the Projects section's grid (design.md §14.5): featured
// rows first, then the staggered columns. The home page shows only the first two.
export default async function ProjectsPage({
  params,
}: PageProps<"/sites/main/[lang]/projects">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const { projects } = await getCachedHomepageData(lang);
  return <ProjectsSection lang={lang} projects={projects} band="default" all />;
}
