import { AboutSection } from "@/components/main/AboutSection";
import { Hero } from "@/components/main/Hero";
import { ProjectsSection } from "@/components/main/ProjectsSection";
import { ServicesSection } from "@/components/main/ServicesSection";
import { SkillsSection } from "@/components/main/SkillsSection";
import { getCachedHomepageData } from "@/lib/portfolio";
import {
  sectionBands,
  sectionNumbers,
  type HomeSectionId,
} from "@/lib/sections";

export default async function Home() {
  const data = await getCachedHomepageData();
  const { profile } = data;

  // The profile row is the page's source of truth; without it there is nothing
  // to show (an unseeded database).
  if (!profile) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 pt-32 pb-24">
        <p className="text-muted">Portfolio content isn&rsquo;t loaded yet.</p>
      </div>
    );
  }

  // Sections with nothing to show are left out, and the index numbers and the
  // alternating bands are worked out from the ones that remain (design.md §14.0).
  const shown: HomeSectionId[] = [];
  if (profile.aboutQuote || profile.aboutBody) shown.push("about");
  if (data.skills.length > 0 || data.certifications.length > 0)
    shown.push("skills");
  if (data.services.length > 0) shown.push("services");
  if (data.projects.length > 0) shown.push("projects");
  const numbers = sectionNumbers(shown);
  const bands = sectionBands(shown);

  return (
    <>
      <Hero profile={profile} socials={data.socials} />
      {shown.includes("about") && (
        <AboutSection
          profile={profile}
          index={numbers.about}
          band={bands.about}
        />
      )}
      {shown.includes("skills") && (
        <SkillsSection
          skills={data.skills}
          certifications={data.certifications}
          index={numbers.skills}
          band={bands.skills}
        />
      )}
      {shown.includes("services") && (
        <ServicesSection
          services={data.services}
          index={numbers.services}
          band={bands.services}
        />
      )}
      {shown.includes("projects") && (
        <ProjectsSection
          projects={data.projects}
          index={numbers.projects}
          band={bands.projects}
        />
      )}
    </>
  );
}
