import { AboutSection } from "@/components/main/AboutSection";
import { ContactSection } from "@/components/main/ContactSection";
import { ExperienceSection } from "@/components/main/ExperienceSection";
import { FaqSection } from "@/components/main/FaqSection";
import { Hero } from "@/components/main/Hero";
import { ProjectsSection } from "@/components/main/ProjectsSection";
import { ServicesSection } from "@/components/main/ServicesSection";
import { SkillsSection } from "@/components/main/SkillsSection";
import { VolunteeringSection } from "@/components/main/VolunteeringSection";
import { JsonLd } from "@/components/shared/JsonLd";
import { getCachedHomepageData } from "@/lib/portfolio";
import { mainJsonLd } from "@/lib/seo";
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
  if (data.experience.length > 0) shown.push("experience");
  if (data.volunteering.length > 0) shown.push("volunteering");
  shown.push("contact");
  if (data.faqs.length > 0) shown.push("faq");
  const numbers = sectionNumbers(shown);
  const bands = sectionBands(shown);

  return (
    <>
      <JsonLd data={mainJsonLd(data)} />
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
      {shown.includes("experience") && (
        <ExperienceSection
          entries={data.experience}
          index={numbers.experience}
          band={bands.experience}
        />
      )}
      {shown.includes("volunteering") && (
        <VolunteeringSection
          entries={data.volunteering}
          index={numbers.volunteering}
          band={bands.volunteering}
        />
      )}
      <ContactSection
        profile={profile}
        socials={data.socials}
        index={numbers.contact}
        band={bands.contact}
      />
      {shown.includes("faq") && (
        <FaqSection faqs={data.faqs} index={numbers.faq} band={bands.faq} />
      )}
    </>
  );
}
