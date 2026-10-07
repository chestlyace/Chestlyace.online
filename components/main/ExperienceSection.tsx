import { SectionHeading } from "@/components/shared/SectionHeading";
import type { HomepageData } from "@/lib/db";
import type { Band } from "@/lib/sections";
import { Section } from "./Section";
import { ExperienceWheel } from "./ExperienceWheel";

// Experience (design.md §14.6): work and education on one timeline, newest
// first, with an "Education" tag on the education entries.
export function ExperienceSection({
  entries,
  index,
  band,
}: {
  entries: HomepageData["experience"];
  index: string;
  band: Band;
}) {
  return (
    <Section id="experience" legacyId="journey" band={band} narrow>
      <SectionHeading index={index} label="Experience" title="Experience" />
      <div className="mt-16 md:mt-24">
        <ExperienceWheel entries={entries} label="Experience" />
      </div>
    </Section>
  );
}
