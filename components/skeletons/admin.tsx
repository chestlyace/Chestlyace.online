import { BrandLoader } from "@/components/shared/BrandLoader";
import { SkeletonBlock, SkeletonShell } from "@/components/shared/Skeleton";

// The admin's loading screen (design.md §13.65, §13.66): the `md` brand loader under the
// heading and six list rows (a handle, a title, a status pill, an icon).
export function AdminListSkeleton() {
  return (
    <SkeletonShell>
      <SkeletonBlock className="h-9 w-56 rounded-md" />
      <SkeletonBlock className="mt-3 h-4 w-80 max-w-full" />
      <div className="my-10 flex justify-center">
        <BrandLoader size="md" decorative />
      </div>
      <div className="grid gap-2">
        {Array.from({ length: 6 }, (_, index) => (
          <div
            key={index}
            aria-hidden="true"
            className="flex items-center gap-4 rounded-lg bg-surface p-4"
          >
            <SkeletonBlock className="size-5 rounded-sm" />
            <SkeletonBlock className="h-5 w-1/3" />
            <SkeletonBlock className="ml-auto h-6 w-20 rounded-full" />
            <SkeletonBlock className="size-8 rounded-full" />
          </div>
        ))}
      </div>
    </SkeletonShell>
  );
}
