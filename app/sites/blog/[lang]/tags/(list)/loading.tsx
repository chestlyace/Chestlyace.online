import { TagsSkeleton } from "@/components/skeletons/blog";

// What Next shows while this route's page is on its way (design.md §13.65): a skeleton
// shaped like the page, inside the site's header and footer. The brand loader joins it
// after 400ms (navigation overlay, §13.64).
export default function Loading() {
  return <TagsSkeleton />;
}
