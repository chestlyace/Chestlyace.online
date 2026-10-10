import { Plus } from "lucide-react";
import { Reveal } from "@/components/shared/Reveal";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { getMessages } from "@/content/messages";
import type { Lang } from "@/lib/i18n";
import type { HomepageData } from "@/lib/db";
import type { Band } from "@/lib/sections";
import { Section } from "./Section";

// FAQ (design.md §14.9, §13.16): a hairline accordion on native <details>, so
// it works without JavaScript and with find-in-page. Several can be open at
// once. The motion is CSS (globals.css).
export function FaqSection({
  lang,
  faqs,
  index,
  band,
}: {
  lang: Lang;
  faqs: HomepageData["faqs"];
  index: string;
  band: Band;
}) {
  const m = getMessages(lang).home.faq;
  return (
    <Section id="faq" band={band} narrow>
      <SectionHeading index={index} label={m.label} title={m.title} />
      <Reveal stagger={0.05} className="mt-16 border-t border-border md:mt-24">
        {faqs.map((faq) => (
          <details
            key={faq.id}
            data-reveal
            className="faq-item group border-b border-border"
          >
            <summary className="relative cursor-pointer rounded-sm py-5 pr-14 text-lead font-medium text-foreground md:py-6">
              {faq.question}
              <span
                aria-hidden="true"
                className="absolute top-1/2 right-0 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-tile transition-colors duration-150 [@media(hover:hover)]:group-hover:bg-tile-hover"
              >
                <Plus className="faq-icon size-5" />
              </span>
            </summary>
            <div className="faq-answer max-w-[68ch] pb-6 text-body text-muted">
              <p>{faq.answer}</p>
            </div>
          </details>
        ))}
      </Reveal>
    </Section>
  );
}
