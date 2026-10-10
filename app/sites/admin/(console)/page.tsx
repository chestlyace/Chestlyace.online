import type { Metadata } from "next";
import { AdminLink as Link } from "@/components/admin/AdminLink";
import { ArrowUpRight } from "lucide-react";
import { getDashboard } from "@/lib/admin/dashboard";
import { RESOURCES } from "@/lib/admin/resources";
import { setupNotices } from "@/lib/admin/setup";
import { relativeTime } from "@/lib/admin/time";
import { getDb } from "@/lib/db";
import { siteUrl } from "@/lib/sites";

export const metadata: Metadata = { title: "Dashboard" };

// Always read fresh: the admin shows what is in the database right now.
export const dynamic = "force-dynamic";

// The dashboard (design.md §14.11): a tile per resource, a link to the site, and
// a notice for anything the build needs that is missing.
export default async function DashboardPage() {
  const tiles = await getDashboard(getDb());
  const notices = setupNotices(process.env);
  const now = new Date();

  return (
    <>
      <h1 className="text-title text-foreground">Dashboard</h1>
      <p className="mt-2 mb-8 text-body text-muted">
        Everything on chestlyace.online, in one place.
      </p>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {RESOURCES.map((resource) => {
          const tile = tiles.find((t) => t.id === resource.id);
          if (!tile) return null;
          const drafts =
            tile.published === null ? null : tile.total - tile.published;
          return (
            <li key={resource.id}>
              <Link
                href={resource.href}
                className="group flex h-full flex-col rounded-lg bg-surface p-5 transition-[background-color,scale] duration-150 ease-out active:scale-[0.98] motion-reduce:active:scale-100 [@media(hover:hover)]:hover:bg-surface-raised"
              >
                <span className="flex items-start justify-between">
                  <span className="type-label text-muted">
                    {resource.label}
                  </span>
                  <ArrowUpRight
                    className="size-5 text-muted transition-[translate,color] duration-150 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground motion-reduce:group-hover:translate-none"
                    aria-hidden="true"
                  />
                </span>
                <span className="mt-4 text-title text-foreground">
                  {tile.total}
                  <span className="sr-only">
                    {tile.total === 1 ? " entry" : " entries"}
                  </span>
                </span>
                <span className="mt-1 text-sm text-muted">
                  {drafts === null
                    ? resource.id === "profile"
                      ? "One profile"
                      : "No drafts: always shown"
                    : `${tile.published} published · ${drafts} ${drafts === 1 ? "draft" : "drafts"}`}
                </span>
                <span className="mt-3 text-sm text-muted">
                  Last edited {relativeTime(tile.lastEdited, now)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      <section aria-labelledby="site-heading" className="mt-12">
        <h2 id="site-heading" className="type-label mb-3 text-muted">
          Site
        </h2>
        <a
          href={siteUrl("main")}
          target="_blank"
          rel="noopener noreferrer"
          className="link-inline text-body font-medium"
        >
          View chestlyace.online
          <ArrowUpRight
            className="ml-0.5 inline size-[0.85em]"
            aria-hidden="true"
          />
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
        {notices.length > 0 && (
          <ul className="mt-6 flex max-w-[44rem] flex-col gap-3">
            {notices.map((notice) => (
              <li
                key={notice}
                className="rounded-lg bg-surface-raised p-4 text-sm text-muted"
              >
                {notice}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
