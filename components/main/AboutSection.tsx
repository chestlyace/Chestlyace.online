import { ArrowDown } from "lucide-react";
import { Button } from "@/components/shared/Button";
import { Reveal } from "@/components/shared/Reveal";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { aboutFacts, splitParagraphs } from "@/lib/about";
import type { HomepageData } from "@/lib/db";
import { resumeHref } from "@/lib/links";
import type { Band } from "@/lib/sections";
import { ScrollLitStatement } from "./ScrollLitStatement";
import { Section } from "./Section";

type Profile = NonNullable<HomepageData["profile"]>;

// About (design.md §14.2): the quote as a scroll-lit statement, then the body
// text beside a short facts list and the resume button.
export function AboutSection({
  profile,
  index,
  band,
}: {
  profile: Profile;
  index: string;
  band: Band;
}) {
  const paragraphs = splitParagraphs(profile.aboutBody);
  const facts = aboutFacts(profile);
  const resume = profile.resumeUrl ? resumeHref(profile.resumeUrl) : null;

  return (
    <Section id="about" band={band} narrow>
      <SectionHeading index={index} label="About" title="About me" />

      {profile.aboutQuote && (
        <ScrollLitStatement
          text={profile.aboutQuote}
          className="mt-16 max-w-[24ch] font-display text-display-lg text-foreground uppercase md:mt-24"
        />
      )}

      <Reveal className="mt-16 grid gap-12 md:mt-24 lg:grid-cols-12 lg:gap-8">
        {paragraphs.length > 0 && (
          <div
            data-reveal
            className="flex max-w-[56ch] flex-col gap-6 text-lead text-foreground lg:col-span-7"
          >
            {paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        )}

        {(facts.length > 0 || resume) && (
          <div data-reveal className="flex flex-col gap-8 lg:col-span-5">
            {facts.length > 0 && (
              <dl className="border-t border-border">
                {facts.map((fact) => (
                  <div
                    key={fact.label}
                    className="grid grid-cols-[7rem_1fr] items-baseline gap-4 border-b border-border py-4"
                  >
                    <dt className="type-label text-muted">{fact.label}</dt>
                    <dd className="text-foreground">{fact.value}</dd>
                  </div>
                ))}
              </dl>
            )}
            {resume && (
              <div>
                <Button
                  href={resume.href}
                  variant="secondary"
                  trailingIcon={<ArrowDown />}
                  iconNudge="down"
                  external={resume.external}
                  {...(resume.external
                    ? {}
                    : { download: "Chestly_Ace_Resume" })}
                >
                  Download Resume
                </Button>
              </div>
            )}
          </div>
        )}
      </Reveal>
    </Section>
  );
}
