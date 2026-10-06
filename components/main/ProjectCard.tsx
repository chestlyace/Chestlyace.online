"use client";

import { ArrowUpRight } from "lucide-react";
import { motion, useMotionValue, useSpring } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState, type MouseEvent, type PointerEvent } from "react";
import { cn } from "@/lib/cn";
import type { HomepageData } from "@/lib/db";
import { imageSource } from "@/lib/hero";
import { useFinePointer, usePrefersReducedMotion } from "@/lib/media";
import { boxOf, setMorph } from "@/lib/morph";
import { EASE_OUT } from "@/lib/motion";
import { rippleEnter, rippleLeave, rippleMove } from "./projectRipple";

type Project = HomepageData["projects"][number];

const LABEL_SIZE = 88;

// One project (design.md §13.10): an image-forward tile — the image, a mono
// category label, the title, and `↗`. With a precise pointer a "VIEW ↗" circle
// follows the cursor over the image, the image zooms slowly, and a WebGL ripple
// runs under the pointer (§14.5). The entrance and the image parallax are
// scroll-driven and live in ProjectsGrid, which marks the parts with data
// attributes.
export function ProjectCard({
  project,
  featured,
  offset,
}: {
  project: Project;
  featured: boolean;
  /** In the grid's right-hand column, pushed down 96px from `md`. */
  offset: boolean;
}) {
  const fine = useFinePointer();
  const reduced = usePrefersReducedMotion();
  const interactive = fine && !reduced;

  const mediaRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const [hovering, setHovering] = useState(false);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { bounce: 0, duration: 0.35 });
  const springY = useSpring(y, { bounce: 0, duration: 0.35 });

  const image = imageSource(project.imageUrl);

  const place = (event: PointerEvent<HTMLElement>, jump: boolean) => {
    const rect = mediaRef.current?.getBoundingClientRect();
    if (!rect) return;
    const nextX = event.clientX - rect.left - LABEL_SIZE / 2;
    const nextY = event.clientY - rect.top - LABEL_SIZE / 2;
    x.set(nextX);
    y.set(nextY);
    if (jump) {
      springX.jump(nextX);
      springY.jump(nextY);
    }
  };

  const onEnter = (event: PointerEvent<HTMLElement>) => {
    if (!interactive || event.pointerType !== "mouse") return;
    place(event, true);
    setHovering(true);
    if (hostRef.current && image.kind !== "none") {
      void rippleEnter(hostRef.current, image.src);
    }
  };
  const onMove = (event: PointerEvent<HTMLElement>) => {
    if (!hovering) return;
    place(event, false);
    if (hostRef.current)
      rippleMove(hostRef.current, event.clientX, event.clientY);
  };
  const onLeave = () => {
    if (!hovering) return;
    setHovering(false);
    rippleLeave();
  };

  // Leaves a note for the project page, which morphs this image into its own
  // (design.md §14.10). Only for a plain click with a precise pointer and motion.
  const onOpen = (event: MouseEvent<HTMLAnchorElement>) => {
    const media = mediaRef.current;
    if (
      !media ||
      image.kind === "none" ||
      !interactive ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    setMorph({
      kind: "open",
      slug: project.slug,
      box: boxOf(media),
      radius: 20,
      src: image.src,
    });
  };

  const imageClasses = "size-full object-cover";

  return (
    <li
      data-card
      data-slug={project.slug}
      className={cn(featured && "md:col-span-2", offset && "md:translate-y-24")}
    >
      <Link
        href={`/projects/${project.slug}`}
        onClick={onOpen}
        className="project-card group/card block rounded-lg outline-none transition-transform duration-[120ms] ease-out active:scale-[0.98]"
      >
        <div
          ref={mediaRef}
          data-card-media
          onPointerEnter={onEnter}
          onPointerMove={onMove}
          onPointerLeave={onLeave}
          className={cn(
            "relative overflow-hidden rounded-lg bg-tile group-focus-visible/card:outline-2 group-focus-visible/card:outline-offset-4 group-focus-visible/card:outline-ring",
            featured ? "aspect-[16/9]" : "aspect-[4/3]",
            hovering && "cursor-none",
          )}
        >
          {image.kind === "none" ? (
            <span
              aria-hidden="true"
              className="absolute inset-0 grid place-items-center p-6 text-center font-display text-display-lg text-muted uppercase"
            >
              {project.title}
            </span>
          ) : (
            // Two layers: the outer box is taller than the frame, so GSAP's
            // parallax can drift it ±5% and scale it on entrance; the inner box
            // is the hover zoom (a CSS `scale`, kept apart from GSAP's
            // transforms) and holds the image and, during a ripple, the canvas —
            // so the canvas matches the image exactly, zoom and parallax included.
            <div
              data-card-image
              className="absolute inset-x-0 -top-[5%] h-[110%]"
            >
              <div ref={hostRef} className="project-image size-full">
                {image.kind === "local" ? (
                  <Image
                    src={image.src}
                    alt=""
                    fill
                    sizes={
                      featured
                        ? "(min-width: 1280px) 1216px, 100vw"
                        : "(min-width: 1280px) 592px, (min-width: 768px) 50vw, 100vw"
                    }
                    className={imageClasses}
                  />
                ) : (
                  // Remote hosts aren't configured for next/image; shown as is.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={image.src}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className={imageClasses}
                  />
                )}
              </div>
            </div>
          )}

          {interactive && (
            <motion.span
              aria-hidden="true"
              style={{
                x: springX,
                y: springY,
                width: LABEL_SIZE,
                height: LABEL_SIZE,
              }}
              initial={false}
              animate={{ opacity: hovering ? 1 : 0, scale: hovering ? 1 : 0.5 }}
              transition={{ duration: 0.2, ease: EASE_OUT }}
              className="type-label pointer-events-none absolute top-0 left-0 z-10 grid place-items-center rounded-full bg-primary text-primary-foreground"
            >
              View ↗
            </motion.span>
          )}
        </div>

        <div data-card-text className="mt-4">
          {project.categoryLabel && (
            <p className="type-label text-muted">{project.categoryLabel}</p>
          )}
          <div className="mt-1.5 flex items-start justify-between gap-4">
            <h3 className="text-h3 text-foreground">{project.title}</h3>
            <ArrowUpRight
              className="mt-1 size-5 shrink-0 text-muted transition-[translate,color] duration-200 ease-out group-hover/card:translate-x-0.5 group-hover/card:-translate-y-0.5 group-hover/card:text-foreground motion-reduce:transition-none"
              aria-hidden="true"
            />
          </div>
        </div>
        <span className="sr-only">: {project.summary}</span>
      </Link>
    </li>
  );
}
