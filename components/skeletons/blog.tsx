import { Container } from "@/components/shared/Container";
import {
  SkeletonBlock,
  SkeletonShell,
  SkeletonText,
} from "@/components/shared/Skeleton";

// Skeletons of the blog's pages (design.md §13.65).

function Heading() {
  return (
    <Container>
      <SkeletonBlock className="h-3 w-16" />
      <SkeletonBlock className="mt-4 h-20 w-64 max-w-full rounded-lg md:h-28" />
      <SkeletonText count={2} className="mt-6 max-w-[52ch]" />
    </Container>
  );
}

function Item({ wide = false }: { wide?: boolean }) {
  return (
    <Container narrow={!wide}>
      <SkeletonBlock className="aspect-[16/9] w-full rounded-lg sm:rounded-xl" />
      <SkeletonBlock className="mt-5 h-3 w-2/5" />
      <SkeletonBlock className="mt-3 h-12 w-4/5 rounded-lg" />
      <SkeletonText count={2} className="mt-4 max-w-[52ch]" />
    </Container>
  );
}

/** The home and a tag's page: the heading and three posts, the first wider. */
export function BlogListSkeleton() {
  return (
    <SkeletonShell className="pt-28 pb-24 md:pb-40">
      <Heading />
      <div className="mt-14 flex flex-col gap-16 md:mt-20 md:gap-24">
        <Item wide />
        <Item />
        <Item />
      </div>
    </SkeletonShell>
  );
}

/** One post: the back link, meta, title, cover and the first paragraphs. */
export function PostSkeleton() {
  return (
    <SkeletonShell className="pt-28 pb-24 md:pb-40">
      <Container>
        <div className="lg:max-w-[calc(100%*10/12)]">
          <SkeletonBlock className="h-4 w-24" />
          <SkeletonBlock className="mt-6 h-3 w-1/3" />
          <SkeletonBlock className="mt-4 h-16 w-full rounded-lg md:h-24" />
          <SkeletonText count={2} className="mt-6 max-w-[52ch]" />
        </div>
        <SkeletonBlock className="mt-12 aspect-[16/9] w-full rounded-lg sm:rounded-xl" />
        <div className="mt-12 grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <SkeletonText count={8} />
            <SkeletonBlock className="mt-10 h-8 w-1/2" />
            <SkeletonText count={6} className="mt-6" />
          </div>
        </div>
      </Container>
    </SkeletonShell>
  );
}

/** The tags index: a heading and a cloud of chips. */
export function TagsSkeleton() {
  return (
    <SkeletonShell className="pt-28 pb-24 md:pb-40">
      <Heading />
      <Container className="mt-14 flex flex-wrap gap-3 md:mt-16">
        {[88, 72, 104, 64, 96, 80, 112, 68].map((width, index) => (
          <SkeletonBlock
            key={index}
            className="h-8 rounded-sm"
            style={{ width }}
          />
        ))}
      </Container>
    </SkeletonShell>
  );
}

/** The privacy page: a heading and long text. */
export function ProseSkeleton() {
  return (
    <SkeletonShell className="pt-28 pb-24 md:pb-40">
      <Container>
        <div className="max-w-[44rem]">
          <SkeletonBlock className="h-3 w-16" />
          <SkeletonBlock className="mt-4 h-20 w-64 max-w-full rounded-lg" />
          <SkeletonBlock className="mt-6 h-3 w-40" />
          <SkeletonText count={6} className="mt-10" />
          <SkeletonBlock className="mt-10 h-7 w-1/3" />
          <SkeletonText count={5} className="mt-5" />
          <SkeletonBlock className="mt-10 h-7 w-1/4" />
          <SkeletonText count={4} className="mt-5" />
        </div>
      </Container>
    </SkeletonShell>
  );
}
