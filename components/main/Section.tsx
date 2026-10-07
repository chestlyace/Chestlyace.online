import type { ReactNode } from "react";
import { Container } from "@/components/shared/Container";
import { cn } from "@/lib/cn";
import type { Band } from "@/lib/sections";

// A homepage section (design.md §14.0): its band sets the background, and the
// `data-band` attribute makes tiles, cards, and fields inside it switch to
// `surface-raised` on the alternate band.
export function Section({
  id,
  band,
  narrow = false,
  legacyId,
  className,
  children,
}: {
  id: string;
  band: Band;
  /** An id the old site used for this section, so old `#…` links still land. */
  legacyId?: string;
  narrow?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      data-band={band === "alt" ? "alt" : undefined}
      className={cn(
        "relative py-24 md:py-40",
        band === "alt" ? "bg-background-alt" : "bg-background",
        className,
      )}
    >
      {legacyId && (
        <span
          id={legacyId}
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-0 scroll-mt-24"
        />
      )}
      <Container narrow={narrow}>{children}</Container>
    </section>
  );
}
