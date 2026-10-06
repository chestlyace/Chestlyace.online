import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type SectionHeadingProps = {
  eyebrow?: string;
  title: ReactNode;
  intro?: ReactNode;
  as?: "h1" | "h2";
  className?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  intro,
  as: Heading = "h2",
  className,
}: SectionHeadingProps) {
  return (
    <div className={cn("max-w-3xl", className)}>
      {eyebrow && (
        <p className="mb-3 font-eyebrow text-xs font-semibold tracking-widest text-muted uppercase">
          {eyebrow}
        </p>
      )}
      <Heading className="font-display text-display-lg text-foreground uppercase">
        {title}
      </Heading>
      {intro && <p className="mt-4 text-body-lg text-muted">{intro}</p>}
    </div>
  );
}
