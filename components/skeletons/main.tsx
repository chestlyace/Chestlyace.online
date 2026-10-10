import { Container } from "@/components/shared/Container";
import {
  SkeletonBlock,
  SkeletonShell,
  SkeletonText,
} from "@/components/shared/Skeleton";

// Skeletons of the main site's pages (design.md §13.65).

function SectionRow({ cards = 3 }: { cards?: number }) {
  return (
    <section className="py-16 md:py-24">
      <Container>
        <SkeletonBlock className="h-3 w-20" />
        <SkeletonBlock className="mt-4 h-16 w-64 max-w-full rounded-lg md:h-24" />
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {Array.from({ length: cards }, (_, index) => (
            <SkeletonBlock
              key={index}
              className="aspect-[4/3] w-full rounded-lg"
            />
          ))}
        </div>
      </Container>
    </section>
  );
}

/** The home: the hero's two big lines, a paragraph and two buttons, then section rows. */
export function MainHomeSkeleton() {
  return (
    <SkeletonShell>
      <section className="flex min-h-[80svh] items-center pt-28 pb-16">
        <Container>
          <SkeletonBlock className="h-5 w-48" />
          <SkeletonBlock className="mt-6 h-24 w-full max-w-3xl rounded-lg md:h-40" />
          <SkeletonBlock className="mt-4 h-24 w-4/5 max-w-2xl rounded-lg md:h-40" />
          <SkeletonText count={3} className="mt-8 max-w-[52ch]" />
          <div className="mt-10 flex gap-3">
            <SkeletonBlock className="h-12 w-40 rounded-full" />
            <SkeletonBlock className="h-12 w-36 rounded-full" />
          </div>
        </Container>
      </section>
      <SectionRow />
      <SectionRow />
    </SkeletonShell>
  );
}

/** A project's page: the hero, the title, the facts and the case study. */
export function ProjectSkeleton() {
  return (
    <SkeletonShell className="pt-28 pb-24">
      <Container>
        <SkeletonBlock className="h-4 w-28" />
        <SkeletonBlock className="mt-8 aspect-video w-full rounded-lg" />
        <SkeletonBlock className="mt-10 h-16 w-3/5 rounded-lg md:h-24" />
        <div className="mt-10 grid gap-10 lg:grid-cols-12">
          <div className="grid content-start gap-4 lg:col-span-4">
            <SkeletonBlock className="h-4 w-1/3" />
            <SkeletonBlock className="h-4 w-2/3" />
            <SkeletonBlock className="h-4 w-1/2" />
            <SkeletonBlock className="h-4 w-3/5" />
          </div>
          <div className="lg:col-span-8">
            <SkeletonText count={6} />
            <SkeletonBlock className="mt-10 h-8 w-1/3" />
            <SkeletonText count={5} className="mt-5" />
          </div>
        </div>
      </Container>
    </SkeletonShell>
  );
}
