import { getMessages } from "@/content/messages";
import type { Lang } from "@/lib/i18n";
import { SectionHeading } from "@/components/shared/SectionHeading";
import type { HomepageData } from "@/lib/db";
import type { Band } from "@/lib/sections";
import { Section } from "./Section";
import { ExperienceWheel } from "./ExperienceWheel";

// Volunteering (design.md §14.7): the same timeline as Experience, with no
// education tags. The page leaves the section out while nothing is published.
export function VolunteeringSection({
  lang,
  entries,
  index,
  band,
}: {
  lang: Lang;
  entries: HomepageData["volunteering"];
  index: string;
  band: Band;
}) {
  const m = getMessages(lang).home;
  return (
    <Section id="volunteering" band={band} narrow>
      <SectionHeading
        index={index}
        label={m.volunteering.label}
        title={m.volunteering.title}
        intro={m.volunteering.intro}
      />
      <div className="mt-16 md:mt-24">
        <ExperienceWheel
          entries={entries}
          label={m.volunteering.title}
          words={{ education: m.experience.education, now: m.timelineNow }}
        />
      </div>
    </Section>
  );
}
