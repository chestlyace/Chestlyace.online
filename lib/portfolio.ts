import { unstable_cache } from "next/cache";
import {
  getDb,
  getHomepageData,
  getProjectBySlug,
  getProjectSlugs,
} from "@/lib/db";

// Cached reads for the pages (architecture.md §5, D64). Every admin write calls
// revalidateTag(PORTFOLIO_TAG), so a page stays static until something changes.
export const PORTFOLIO_TAG = "portfolio";

// Next's data cache outlives deployments. Keying on the commit means a new
// deployment never shows an older deployment's data; the admin's tag
// revalidation still refreshes within a deployment.
const deployment = process.env.VERCEL_GIT_COMMIT_SHA ?? "local";

// In `next dev` reads are never cached, so editing or re-seeding the database
// shows up on the next refresh.
function cached<Args extends unknown[], Result>(
  name: string,
  read: (...args: Args) => Promise<Result>,
) {
  if (process.env.NODE_ENV === "development") return read;
  return unstable_cache(read, [name, deployment], { tags: [PORTFOLIO_TAG] });
}

export const getCachedHomepageData = cached("homepage", () =>
  getHomepageData(getDb()),
);

export const getCachedProject = cached("project", (slug: string) =>
  getProjectBySlug(slug, getDb()),
);

export const getCachedProjectSlugs = cached("project-slugs", () =>
  getProjectSlugs(getDb()),
);
