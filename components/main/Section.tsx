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
  className,
  children,
}: {
  id: string;
  band: Band;
  narrow?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      data-band={band === "alt" ? "alt" : undefined}
      className={cn(
        "py-24 md:py-40",
        band === "alt" ? "bg-background-alt" : "bg-background",
        className,
      )}
    >
      <Container narrow={narrow}>{children}</Container>
    </section>
  );
}
