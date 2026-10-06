"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { MouseEvent } from "react";
import { RollText } from "@/components/shared/RollText";
import { cn } from "@/lib/cn";
import { useFinePointer, usePrefersReducedMotion } from "@/lib/media";
import { boxOf, setMorph } from "@/lib/morph";

// "← All projects" (design.md §14.10). On the way out it leaves a note of where
// the hero image is, so the home page can fly it back into the project's card.
export function ProjectBackLink({
  slug,
  imageSrc,
}: {
  slug: string;
  imageSrc: string | null;
}) {
  const fine = useFinePointer();
  const reduced = usePrefersReducedMotion();

  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (
      !imageSrc ||
      !fine ||
      reduced ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    const hero = document.querySelector("[data-project-hero]");
    if (!hero) return;
    setMorph({
      kind: "close",
      slug,
      box: boxOf(hero),
      radius: 28,
      src: imageSrc,
    });
  };

  return (
    <Link
      href="/#projects"
      onClick={onClick}
      className={cn(
        "roll-host inline-flex items-center gap-2 rounded-sm text-body font-medium text-foreground transition-colors duration-150 hover:text-primary-text focus-visible:text-primary-text",
      )}
    >
      <ArrowLeft className="size-[1em]" aria-hidden="true" />
      <RollText>All projects</RollText>
    </Link>
  );
}
