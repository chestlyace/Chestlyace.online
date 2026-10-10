import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminListSkeleton } from "@/components/skeletons/admin";
import {
  BlogListSkeleton,
  PostSkeleton,
  ProseSkeleton,
  TagsSkeleton,
} from "@/components/skeletons/blog";
import {
  CreativesHomeSkeleton,
  EventSkeleton,
  GallerySkeleton,
  PhotographySkeleton,
  ServicesSkeleton,
} from "@/components/skeletons/creatives";
import { MainHomeSkeleton, ProjectSkeleton } from "@/components/skeletons/main";

export const metadata: Metadata = {
  title: "Skeletons",
  robots: { index: false, follow: false },
};

const SKELETONS = [
  ["Main home", MainHomeSkeleton],
  ["Project", ProjectSkeleton],
  ["Blog list and tag page", BlogListSkeleton],
  ["Post", PostSkeleton],
  ["Tags", TagsSkeleton],
  ["Privacy", ProseSkeleton],
  ["Creatives home", CreativesHomeSkeleton],
  ["Design gallery", GallerySkeleton],
  ["Photography", PhotographySkeleton],
  ["Event", EventSkeleton],
  ["Services", ServicesSkeleton],
  ["Admin list", AdminListSkeleton],
] as const;

// Every page skeleton (design.md §13.65) on one page, to look at them: a dev and
// preview page like the design system, a 404 in production.
export default function SkeletonsPage() {
  if (process.env.VERCEL_ENV === "production") notFound();
  return (
    <div className="pt-24">
      {SKELETONS.map(([name, Skeleton]) => (
        <section
          key={name}
          aria-label={name}
          className="mx-auto mb-16 max-w-[1400px] overflow-hidden border-y border-border"
        >
          <p className="type-label bg-background-alt px-4 py-2 text-muted">
            {name}
          </p>
          <div className="relative max-h-[900px] overflow-hidden">
            <Skeleton />
          </div>
        </section>
      ))}
    </div>
  );
}
