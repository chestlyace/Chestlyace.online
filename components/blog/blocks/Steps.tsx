"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { usePrefersReducedMotion } from "@/lib/media";
import { useReveal } from "./useReveal";

export type StepView = {
  title: string;
  icon: ReactNode;
  text: ReactNode;
};

function StepItem({
  index,
  step,
  active,
  reduced,
  setMarker,
}: {
  index: number;
  step: StepView;
  active: boolean;
  reduced: boolean;
  setMarker: (index: number, element: HTMLElement | null) => void;
}) {
  const ref = useRef<HTMLLIElement>(null);
  useReveal(ref);
  const lit = reduced || active;
  return (
    <li
      ref={ref}
      className="group/step relative flex gap-6 pb-12 last:pb-0 [&[data-phase=armed]>div]:translate-y-4 [&[data-phase=armed]>div]:opacity-0"
    >
      <span
        ref={(element) => setMarker(index, element)}
        aria-hidden="true"
        className={cn(
          "relative z-10 grid size-8 shrink-0 place-items-center rounded-full border text-muted transition-[background-color,border-color,color,transform] duration-300 ease-out sm:size-10 [&_svg]:size-4 sm:[&_svg]:size-5",
          lit
            ? "scale-[1.04] border-primary bg-primary text-primary-foreground"
            : "border-border bg-tile",
        )}
      >
        {step.icon ?? <span className="type-label">{index + 1}</span>}
      </span>
      <div className="min-w-0 pt-0.5 transition-[opacity,transform] duration-[650ms] ease-out sm:pt-1.5">
        <p className="type-label text-muted">
          Step {String(index + 1).padStart(2, "0")}
        </p>
        <h3 className="mt-1 text-h3 text-foreground">{step.title}</h3>
        <div className="mt-2 text-body leading-[1.7] text-foreground [&>p+p]:mt-3">
          {step.text}
        </div>
      </div>
    </li>
  );
}

// `steps` (design.md §13.38): a vertical timeline whose rail fills as the reader
// scrolls. A step is active while it is the nearest to 40% down the viewport,
// and earlier steps stay filled.
export function Steps({ steps }: { steps: StepView[] }) {
  const reduced = usePrefersReducedMotion();
  const listRef = useRef<HTMLOListElement>(null);
  const markers = useRef<(HTMLElement | null)[]>([]);
  const [active, setActive] = useState(-1);
  const [fill, setFill] = useState(0);

  useEffect(() => {
    if (reduced) return;
    const update = () => {
      const list = listRef.current;
      if (!list) return;
      const line = window.innerHeight * 0.4;
      const top = list.getBoundingClientRect().top;
      let current = -1;
      let reach = 0;
      markers.current.forEach((marker, index) => {
        if (!marker) return;
        const box = marker.getBoundingClientRect();
        const centre = box.top + box.height / 2;
        if (centre <= line) {
          current = index;
          reach = centre - top;
        }
      });
      // The rail fills smoothly toward the line, never past the last marker.
      const last = markers.current[steps.length - 1]?.getBoundingClientRect();
      const lastCentre = last ? last.top + last.height / 2 - top : 0;
      const target = Math.min(Math.max(line - top, 0), lastCentre);
      setActive(current);
      setFill(current === -1 ? 0 : Math.max(reach, target));
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [reduced, steps.length]);

  return (
    <ol ref={listRef} className="relative my-10">
      <span
        aria-hidden="true"
        className="absolute top-4 bottom-4 left-4 w-0.5 -translate-x-1/2 bg-border sm:left-5"
      />
      <span
        aria-hidden="true"
        className="absolute top-4 left-4 w-0.5 -translate-x-1/2 bg-primary sm:left-5"
        style={{ height: reduced ? "calc(100% - 2rem)" : fill }}
      />
      {steps.map((step, index) => (
        <StepItem
          key={index}
          index={index}
          step={step}
          active={index <= active}
          reduced={reduced}
          setMarker={(i, element) => {
            markers.current[i] = element;
          }}
        />
      ))}
    </ol>
  );
}
