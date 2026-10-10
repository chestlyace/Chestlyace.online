import type { Metadata } from "next";
import { AdminLink as Link } from "@/components/admin/AdminLink";
import { Chip } from "@/components/admin/Chip";
import { relativeTime, serverNow } from "@/lib/admin/time";
import { getDb } from "@/lib/db";
import { listActivity } from "@/lib/mcp/activity";
import { listTokens } from "@/lib/mcp/tokens";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Agent activity" };
export const dynamic = "force-dynamic";

// What agents did (docs/mcp.md §7): the latest 200 calls, filterable by token.
export default async function ActivityPage({
  searchParams,
}: PageProps<"/sites/admin/agent/activity">) {
  const { token } = await searchParams;
  const tokenId =
    typeof token === "string" && /^\d+$/.test(token)
      ? Number(token)
      : undefined;
  const db = getDb();
  const [items, tokens] = await Promise.all([
    listActivity(db, tokenId ? { tokenId } : {}),
    listTokens(db),
  ]);
  const now = serverNow();
  return (
    <>
      <h1 className="text-title text-foreground">Agent activity</h1>
      <p className="mt-2 mb-6 text-body text-muted">
        The latest {items.length === 200 ? "200 " : ""}calls agents made, newest
        first. Kept for 90 days.
      </p>
      <nav aria-label="Filter by token" className="mb-6 flex flex-wrap gap-2">
        {[{ id: undefined, name: "All tokens" }, ...tokens].map((entry) => (
          <Link
            key={entry.id ?? "all"}
            href={
              entry.id ? `/agent/activity?token=${entry.id}` : "/agent/activity"
            }
            aria-current={entry.id === tokenId ? "true" : undefined}
            className={cn(
              "type-label inline-flex h-9 items-center rounded-full px-4 transition-colors duration-150",
              entry.id === tokenId
                ? "bg-primary text-primary-foreground"
                : "bg-tile text-muted hover:text-foreground",
            )}
          >
            {entry.name}
          </Link>
        ))}
      </nav>
      {items.length === 0 ? (
        <p className="text-body text-muted">
          Nothing yet. Calls appear here as agents work.
        </p>
      ) : (
        <ul className="grid gap-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="grid gap-1 rounded-lg bg-surface p-4 sm:grid-cols-[8rem_1fr_auto] sm:items-center sm:gap-4"
            >
              <time
                dateTime={item.at}
                title={item.at}
                className="type-label text-muted"
              >
                {relativeTime(new Date(item.at), now)}
              </time>
              <div className="min-w-0">
                <p className="truncate text-body text-foreground">
                  <span className="font-mono text-[0.9375rem]">
                    {item.tool}
                  </span>
                  {item.summary && (
                    <span className="text-muted"> · {item.summary}</span>
                  )}
                </p>
                {item.error && (
                  <p className="text-sm text-danger">{item.error}</p>
                )}
                <p className="text-sm text-muted">{item.tokenName}</p>
              </div>
              <Chip tone={item.ok ? "on" : "danger"}>
                {item.ok ? "OK" : "Error"}
              </Chip>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
