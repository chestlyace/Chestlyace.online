import { Container } from "@/components/shared/Container";
import {
  SkeletonBlock,
  SkeletonShell,
  SkeletonText,
} from "@/components/shared/Skeleton";

// Skeletons of the creatives pages (design.md §13.65).

function Heading() {
  return (
    <>
      <SkeletonBlock className="h-3 w-32" />
      <SkeletonBlock className="mt-4 h-20 w-72 max-w-full rounded-lg md:h-28" />
      <SkeletonText count={2} className="mt-6 max-w-[52ch]" />
    </>
  );
}

// The masonry's block heights, as a multiple of the column width.
const RATIOS = [1.0, 1.3, 0.8, 1.2, 1.0, 1.4];

/** Design: the heading, four filter chips and six masonry blocks. */
export function GallerySkeleton() {
  return (
    <SkeletonShell className="pt-28 pb-24 md:pb-32">
      <Container className="2xl:max-w-[calc(1600px+4rem)]">
        <Heading />
        <div className="mt-12 flex gap-2 md:mt-16">
          {[72, 128, 88, 96].map((width, index) => (
            <SkeletonBlock
              key={index}
              className="h-9 rounded-full"
              style={{ width }}
            />
          ))}
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {RATIOS.map((ratio, index) => (
            <SkeletonBlock
              key={index}
              className="w-full rounded-md"
              style={{ aspectRatio: `1 / ${ratio}` }}
            />
          ))}
        </div>
      </Container>
    </SkeletonShell>
  );
}

/** Photography: the heading and four event tiles, the first across both columns. */
export function PhotographySkeleton() {
  return (
    <SkeletonShell className="pt-28 pb-24 md:pb-32">
      <Container>
        <Heading />
        <div className="mt-12 grid gap-x-6 gap-y-14 md:mt-16 md:grid-cols-2 md:gap-y-16">
          <SkeletonBlock className="aspect-[4/3] w-full rounded-lg md:col-span-2" />
          <SkeletonBlock className="aspect-[4/3] w-full rounded-lg" />
          <SkeletonBlock className="aspect-[4/3] w-full rounded-lg" />
          <SkeletonBlock className="aspect-[4/3] w-full rounded-lg" />
        </div>
      </Container>
    </SkeletonShell>
  );
}

/** An event: the cover, the sidebar and the pictures. */
export function EventSkeleton() {
  return (
    <SkeletonShell>
      <SkeletonBlock className="h-[70svh] min-h-[22rem] w-full rounded-none" />
      <Container className="grid gap-12 py-14 md:py-20 lg:grid-cols-12 lg:gap-10">
        <div className="grid content-start gap-4 lg:col-span-4">
          <SkeletonBlock className="h-3 w-32" />
          <SkeletonBlock className="h-4 w-2/3" />
          <SkeletonBlock className="h-4 w-1/2" />
          <SkeletonBlock className="h-4 w-3/5" />
          <SkeletonBlock className="mt-4 h-12 w-48 rounded-full" />
        </div>
        <div className="grid gap-10 lg:col-span-8">
          <SkeletonText count={4} className="max-w-[60ch]" />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            {[1.3, 0.8, 1.0, 1.0, 1.3, 0.8].map((ratio, index) => (
              <SkeletonBlock
                key={index}
                className="w-full"
                style={{ aspectRatio: `1 / ${ratio}` }}
              />
            ))}
          </div>
        </div>
      </Container>
    </SkeletonShell>
  );
}

/** Services: the heading and two rows of three cards. */
export function ServicesSkeleton() {
  return (
    <SkeletonShell className="pt-28 pb-24 md:pb-32">
      <Container>
        <Heading />
        <div className="mt-16 grid gap-6 md:mt-24 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <SkeletonBlock key={index} className="h-56 w-full rounded-lg" />
          ))}
        </div>
      </Container>
    </SkeletonShell>
  );
}

/** The home: the hero, the marquee band and the two portals. */
export function CreativesHomeSkeleton() {
  return (
    <SkeletonShell>
      <section className="flex min-h-[80svh] items-center pt-28 pb-16">
        <Container>
          <SkeletonBlock className="h-28 w-full max-w-3xl rounded-lg md:h-44" />
          <SkeletonBlock className="mt-4 h-28 w-3/4 max-w-2xl rounded-lg md:h-44" />
          <SkeletonText count={2} className="mt-8 max-w-[52ch]" />
          <div className="mt-10 flex gap-3">
            <SkeletonBlock className="h-12 w-40 rounded-full" />
            <SkeletonBlock className="h-12 w-36 rounded-full" />
          </div>
        </Container>
      </section>
      <SkeletonBlock className="h-16 w-full rounded-none" />
      <Container className="grid gap-4 py-24 md:grid-cols-2 md:py-32">
        <SkeletonBlock className="aspect-[4/5] w-full rounded-lg" />
        <SkeletonBlock className="aspect-[4/5] w-full rounded-lg" />
      </Container>
    </SkeletonShell>
  );
}
