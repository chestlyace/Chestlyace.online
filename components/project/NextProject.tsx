import { ArrowRight } from "lucide-react";
import { Link } from "@/components/shared/Link";
import { Container } from "@/components/shared/Container";
import type { NextProject as Next } from "@/lib/db";
import { imageSource } from "@/lib/hero";

// The band that ends a project page (design.md §14.10): the next project's name
// in big type, as one link. After the last project it points to the first. On a
// hover device the project's image fades in behind the title and the arrow nudges
// 8px (400ms).
export function NextProject({
  next,
  label,
}: {
  next: Next;
  /** "Next project", the section's accessible name. */
  label: string;
}) {
  const image = imageSource(next.imageUrl);

  return (
    <section aria-label={label} data-band="alt" className="bg-background-alt">
      <Link
        href={`/projects/${next.slug}`}
        className="group/next relative isolate block overflow-hidden outline-none focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-ring"
      >
        {image.kind !== "none" && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image.src}
            alt=""
            loading="lazy"
            decoding="async"
            className="absolute inset-0 -z-10 size-full object-cover opacity-0 transition-opacity duration-[400ms] ease-out [@media(hover:hover)]:group-hover/next:opacity-25"
          />
        )}
        <Container className="flex min-h-80 flex-col justify-center gap-6 py-16">
          <span className="type-label text-muted">Next project</span>
          <span className="flex items-end justify-between gap-6">
            <span className="font-display text-display-lg text-foreground uppercase md:text-display-xl">
              {next.title}
            </span>
            <ArrowRight
              className="mb-2 size-8 shrink-0 text-foreground transition-transform duration-[400ms] ease-out md:size-10 [@media(hover:hover)]:group-hover/next:translate-x-2 motion-reduce:transition-none motion-reduce:group-hover/next:translate-x-0"
              aria-hidden="true"
            />
          </span>
          {next.categoryLabel && (
            <span className="type-label text-muted">{next.categoryLabel}</span>
          )}
        </Container>
      </Link>
    </section>
  );
}
