import { Reveal } from "@/components/shared/Reveal";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { getMessages } from "@/content/messages";
import type { Lang } from "@/lib/i18n";
import type { HomepageData } from "@/lib/db";
import type { Band } from "@/lib/sections";
import { groupSkills, skillIcon } from "@/lib/skills";
import { CertificationItem } from "./CertificationItem";
import { Section } from "./Section";
import { SkillLogo } from "./SkillLogo";

// Skills and certifications (design.md §14.3, §13.17): groups of logo tiles, then
// the certification badges under a mono label.
export function SkillsSection({
  lang,
  skills,
  certifications,
  index,
  band,
}: {
  lang: Lang;
  skills: HomepageData["skills"];
  certifications: HomepageData["certifications"];
  index: string;
  band: Band;
}) {
  const m = getMessages(lang).home.skills;
  const groups = groupSkills(skills, m.groups);

  return (
    <Section id="skills" band={band}>
      <SectionHeading index={index} label={m.label} title={m.title} />

      <div className="mt-12 flex flex-col gap-12 md:mt-16">
        {groups.map((group) => (
          <section
            key={group.category}
            aria-labelledby={`skills-${group.category}`}
            className="grid gap-4 lg:grid-cols-12 lg:gap-8"
          >
            <h3
              id={`skills-${group.category}`}
              className="type-label self-start text-muted lg:sticky lg:top-28 lg:col-span-3"
            >
              {group.label}
            </h3>
            <Reveal
              className="lg:col-span-9"
              y={16}
              duration={0.5}
              stagger={0.04}
            >
              <ul className="flex flex-wrap gap-3">
                {group.skills.map((skill) => (
                  // The <li> is what GSAP reveals; the tile inside it has the
                  // hover lift, so the two never share a transform.
                  <li key={skill.id} data-reveal>
                    <div className="group/tile flex h-14 items-center gap-3 rounded-md bg-tile px-4 transition-transform duration-150 ease-out hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0">
                      <SkillLogo icon={skillIcon(skill)} />
                      <span className="text-sm font-medium text-foreground">
                        {skill.name}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </Reveal>
          </section>
        ))}
      </div>

      {certifications.length > 0 && (
        <section
          aria-labelledby="skills-certifications"
          className="mt-24 md:mt-24"
        >
          <h3 id="skills-certifications" className="type-label mb-6 text-muted">
            {m.certifications}
          </h3>
          <Reveal
            className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
            y={16}
            duration={0.5}
            stagger={0.05}
          >
            {certifications.map((certification) => (
              <div key={certification.id} data-reveal className="h-full">
                <CertificationItem
                  certification={certification}
                  lang={lang}
                  verifyLabel={m.verifyCredential}
                />
              </div>
            ))}
          </Reveal>
        </section>
      )}
    </Section>
  );
}
