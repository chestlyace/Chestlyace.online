import { unstable_cache } from "next/cache";
import type { Lang } from "@/lib/i18n";
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

// The language is part of the cache key (its argument), so each language is cached
// on its own; the tag is shared, so an admin write refreshes both (docs/i18n.md §5).
export const getCachedHomepageData = cached("homepage", (lang?: Lang) =>
  getHomepageData(getDb(), lang),
);

export const getCachedProject = cached("project", (slug: string, lang?: Lang) =>
  getProjectBySlug(slug, getDb(), lang),
);

export const getCachedProjectSlugs = cached("project-slugs", () =>
  getProjectSlugs(getDb()),
);
