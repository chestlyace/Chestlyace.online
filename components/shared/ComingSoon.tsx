import { ArrowUpRight } from "lucide-react";
import {
  COMING_SOON,
  COMING_SOON_BUTTON,
  COMING_SOON_LABEL,
} from "@/content/copy";
import { siteUrl, type PublicSiteKey } from "@/lib/sites";
import { Button } from "./Button";
import { Container } from "./Container";
import { Reveal } from "./Reveal";
import { SectionHeading } from "./SectionHeading";

// What the creatives and blog hosts show until they are built (design.md
// §14.12): the section heading's look (label, Bebas title, lead), one primary
// button to the main site. Placeholder wording is in content/copy.ts.
export function ComingSoon({ site }: { site: Exclude<PublicSiteKey, "main"> }) {
  const { title, lead } = COMING_SOON[site];
  return (
    <div className="flex min-h-[30rem] flex-1 items-center pt-28 pb-24">
      <Container>
        <SectionHeading
          as="h1"
          label={COMING_SOON_LABEL}
          title={title}
          intro={lead}
        />
        <Reveal y={16} className="mt-10">
          <Button
            href={siteUrl("main")}
            size="lg"
            trailingIcon={<ArrowUpRight />}
            iconNudge="up-right"
            className="w-full sm:w-auto"
          >
            {COMING_SOON_BUTTON}
          </Button>
        </Reveal>
      </Container>
    </div>
  );
}
