import { Plus } from "lucide-react";
import { Reveal } from "@/components/shared/Reveal";
import type { PublicFaq } from "@/lib/creatives/data";

// The questions of one group, as the hairline accordion of the main site's FAQ
// (design.md §14.9, §13.16): native <details>, so it works without JavaScript and
// with find-in-page. The motion is CSS (globals.css).
export function FaqList({ faqs }: { faqs: readonly PublicFaq[] }) {
  return (
    <Reveal stagger={0.05} className="border-t border-border">
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
  );
}
