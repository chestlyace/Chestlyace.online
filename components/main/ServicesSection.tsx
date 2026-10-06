import { ArrowUpRight } from "lucide-react";
import type { CSSProperties } from "react";
import { CREATIVES_CARD, SERVICES_INTRO } from "@/content/copy";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { cn } from "@/lib/cn";
import type { HomepageData } from "@/lib/db";
import type { Band } from "@/lib/sections";
import { siteUrl } from "@/lib/sites";
import { Section } from "./Section";
import { ServiceIcon } from "./ServiceIcon";
import { ServiceStack } from "./ServiceStack";

type Service = HomepageData["services"][number];

// Cards stick 112px below the top (96px on phones), each 16px (8px) lower than
// the one before, so every earlier card's top edge peeks out (design.md §13.11).
function stickyOffsets(index: number): CSSProperties {
  return {
    "--stack-top": `${112 + index * 16}px`,
    "--stack-top-sm": `${96 + index * 8}px`,
  } as CSSProperties;
}

const CARD_HEIGHT = "md:min-h-[min(70vh,560px)]";

function ServiceCard({ service, index }: { service: Service; index: number }) {
  return (
    <li
      data-stack-card
      className={cn(
        "stack-card overflow-hidden rounded-xl bg-tile p-6 md:p-12",
        CARD_HEIGHT,
      )}
      style={stickyOffsets(index)}
    >
      <div className="grid gap-8 md:grid-cols-2 md:gap-12">
        <div className="flex flex-col gap-4 md:justify-between">
          <span
            aria-hidden="true"
            className="font-display text-display-lg text-muted"
          >
            {String(index + 1).padStart(2, "0")}
          </span>
          <h3 className="text-title text-foreground">{service.title}</h3>
        </div>
        <div className="flex flex-col gap-6">
          <span className="text-foreground">
            <ServiceIcon name={service.icon} />
          </span>
          <p className="max-w-[52ch] text-lead text-muted">
            {service.description}
          </p>
          {service.items.length > 0 && (
            <ul className="grid gap-x-8 md:grid-cols-2">
              {service.items.map((item) => (
                <li
                  key={item}
                  className="flex gap-3 border-b border-border py-3 text-foreground first:border-t md:nth-2:border-t"
                >
                  <span aria-hidden="true" className="text-muted">
                    –
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <span
        data-stack-dim
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[var(--band-bg)] opacity-0"
      />
    </li>
  );
}

// The fixed card that ends the stack (design.md §13.12): not a database row, so
// it can't be deleted by accident. Inverted, and one link to the creatives site.
function CreativesCard({ index }: { index: number }) {
  return (
    <li
      data-stack-card
      className={cn("stack-card rounded-xl", CARD_HEIGHT)}
      style={stickyOffsets(index)}
    >
      <a
        href={siteUrl("creatives")}
        className={cn(
          "group/creatives relative flex h-full flex-col justify-between gap-12 rounded-xl bg-foreground p-6 text-background transition-transform duration-300 ease-out hover:scale-[1.01] active:scale-[0.98] focus-visible:outline-offset-4 md:p-12",
          CARD_HEIGHT,
        )}
      >
        <span className="type-label opacity-60">{CREATIVES_CARD.label}</span>
        <ArrowUpRight
          className="absolute top-6 right-6 size-8 transition-transform duration-300 ease-out group-hover/creatives:translate-x-1 group-hover/creatives:-translate-y-1 md:top-12 md:right-12"
          aria-hidden="true"
        />
        <span className="flex flex-col gap-4">
          <span className="max-w-[18ch] text-title">
            {CREATIVES_CARD.title}
          </span>
          <span className="max-w-[40ch] text-lead opacity-70">
            {CREATIVES_CARD.line}
          </span>
        </span>
        <span className="sr-only"> (opens the Creatives site)</span>
      </a>
    </li>
  );
}

// Services (design.md §14.4): heading, intro, then the stacking cards with the
// Creatives card last.
export function ServicesSection({
  services,
  index,
  band,
}: {
  services: HomepageData["services"];
  index: string;
  band: Band;
}) {
  return (
    <Section id="services" band={band}>
      <SectionHeading
        index={index}
        label="Services"
        title="Services"
        intro={SERVICES_INTRO}
      />
      <ServiceStack className="mt-12 flex flex-col gap-6 md:mt-16">
        {services.map((service, i) => (
          <ServiceCard key={service.id} service={service} index={i} />
        ))}
        <CreativesCard index={services.length} />
      </ServiceStack>
    </Section>
  );
}
