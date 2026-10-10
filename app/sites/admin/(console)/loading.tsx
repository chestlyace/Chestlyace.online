import { AdminListSkeleton } from "@/components/skeletons/admin";

// While an admin screen loads: the shell stays, the content area shows a list skeleton
// with the brand loader (design.md §13.66).
export default function Loading() {
  return <AdminListSkeleton />;
}
