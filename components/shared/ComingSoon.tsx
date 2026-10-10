import { ArrowUpRight } from "lucide-react";
import { getMessages } from "@/content/messages";
import { DEFAULT_LANG, localizedPath, type Lang } from "@/lib/i18n";
import { siteUrl, type PublicSiteKey } from "@/lib/sites";
import { Button } from "./Button";
import { Container } from "./Container";
import { Reveal } from "./Reveal";
import { SectionHeading } from "./SectionHeading";

// What the creatives and blog hosts show until they have something to show (design.md
// §14.12): the section heading's look (label, Bebas title, lead), one primary button
// to the main site. The wording is in content/messages.
export function ComingSoon({
  site,
  lang = DEFAULT_LANG,
}: {
  site: Exclude<PublicSiteKey, "main">;
  lang?: Lang;
}) {
  const m = getMessages(lang).comingSoon;
  const { title, lead } = m[site];
  return (
    <div className="flex min-h-[30rem] flex-1 items-center pt-28 pb-24">
      <Container>
        <SectionHeading as="h1" label={m.label} title={title} intro={lead} />
        <Reveal y={16} className="mt-10">
          <Button
            href={siteUrl("main", localizedPath("/", lang))}
            size="lg"
            trailingIcon={<ArrowUpRight />}
            iconNudge="up-right"
            className="w-full sm:w-auto"
          >
            {m.button}
          </Button>
        </Reveal>
      </Container>
    </div>
  );
}
