import { VOLUNTEERING_INTRO } from "@/content/copy";
import { SectionHeading } from "@/components/shared/SectionHeading";
import type { HomepageData } from "@/lib/db";
import type { Band } from "@/lib/sections";
import { Section } from "./Section";
import { Timeline } from "./Timeline";

// Volunteering (design.md §14.7): the same timeline as Experience, with no
// education tags. The page leaves the section out while nothing is published.
export function VolunteeringSection({
  entries,
  index,
  band,
}: {
  entries: HomepageData["volunteering"];
  index: string;
  band: Band;
}) {
  return (
    <Section id="volunteering" band={band} narrow>
      <SectionHeading
        index={index}
        label="Volunteering"
        title="Volunteering"
        intro={VOLUNTEERING_INTRO}
      />
      <div className="mt-16 md:mt-24">
        <Timeline entries={entries} label="Volunteering" />
      </div>
    </Section>
  );
}
