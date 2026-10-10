import { ServiceIcon } from "@/components/main/ServiceIcon";
import type { PublicService } from "@/lib/creatives/data";

// One service on the Services page (design.md §14.24, the cards of §14.4 in the
// creatives accent): an icon, the title, the description and what is offered.
export function ServiceCard({ service }: { service: PublicService }) {
  return (
    <li
      data-reveal
      className="flex flex-col gap-4 border border-border bg-tile p-6 md:p-8"
    >
      <span className="text-primary-text">
        <ServiceIcon name={service.icon} size={36} />
      </span>
      <h3 className="text-h3 text-foreground">{service.title}</h3>
      <p className="text-body text-muted">{service.description}</p>
      {service.items.length > 0 && (
        <ul className="mt-auto grid gap-2 border-t border-border pt-4 text-sm text-foreground">
          {service.items.map((item) => (
            <li key={item} className="flex gap-2">
              <span
                aria-hidden="true"
                className="mt-[0.55em] size-1.5 shrink-0 bg-primary"
              />
              {item}
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
