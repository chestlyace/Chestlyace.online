import { ArrowLeft, ArrowRight } from "lucide-react";
import { Link } from "@/components/shared/Link";
import type { PostSummary } from "@/lib/blog/data";
import { cn } from "@/lib/cn";

function Block({
  post,
  direction,
}: {
  post: PostSummary;
  direction: "previous" | "next";
}) {
  const next = direction === "next";
  return (
    <Link
      href={`/${post.slug}`}
      aria-label={`${next ? "Next" : "Previous"} post: ${post.title}`}
      className={cn(
        "group/nav block rounded-md p-8 outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
        next && "md:text-right",
      )}
    >
      <p
        className={cn(
          "type-label flex items-center gap-2 text-muted",
          next && "md:justify-end",
        )}
      >
        {!next && (
          <ArrowLeft
            className="size-4 transition-transform duration-150 ease-out group-hover/nav:-translate-x-1"
            aria-hidden="true"
          />
        )}
        {next ? "Next" : "Previous"}
        {next && (
          <ArrowRight
            className="size-4 transition-transform duration-150 ease-out group-hover/nav:translate-x-1"
            aria-hidden="true"
          />
        )}
      </p>
      <p className="mt-3 text-h3 text-foreground transition-colors duration-150 group-hover/nav:text-primary-text">
        {post.title}
      </p>
    </Link>
  );
}

// The way on from a post (design.md §13.33): the older and the newer post.
export function PostNavigation({
  previous,
  next,
}: {
  previous: PostSummary | null;
  next: PostSummary | null;
}) {
  if (!previous && !next) return null;
  return (
    <nav
      aria-label="More posts"
      className="grid border-y border-border md:grid-cols-2 md:divide-x md:divide-border max-md:divide-y max-md:divide-border"
    >
      <div>{previous && <Block post={previous} direction="previous" />}</div>
      <div>{next && <Block post={next} direction="next" />}</div>
    </nav>
  );
}
