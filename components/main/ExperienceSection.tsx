import { getMessages } from "@/content/messages";
import type { Lang } from "@/lib/i18n";
import type { HomepageData } from "@/lib/db";
import type { Band } from "@/lib/sections";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { ExperienceWheel } from "./ExperienceWheel";
import { Section } from "./Section";

// Experience (design.md §14.6): work and education on one timeline, newest
// first, with an "Education" tag on the education entries.
export function ExperienceSection({
  lang,
  entries,
  index,
  band,
}: {
  lang: Lang;
  entries: HomepageData["experience"];
  index: string;
  band: Band;
}) {
  const m = getMessages(lang).home;
  return (
    <Section id="experience" legacyId="journey" band={band} narrow>
      <SectionHeading
        index={index}
        label={m.experience.label}
        title={m.experience.title}
      />
      <div className="mt-16 md:mt-24">
        <ExperienceWheel
          entries={entries}
          label={m.experience.title}
          words={{ education: m.experience.education, now: m.timelineNow }}
        />
      </div>
    </Section>
  );
}
