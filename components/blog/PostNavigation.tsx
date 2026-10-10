import { ArrowLeft, ArrowRight } from "lucide-react";
import { Link } from "@/components/shared/Link";
import { getMessages } from "@/content/messages";
import type { Lang } from "@/lib/i18n";
import { format } from "@/lib/i18n/format";
import type { PostSummary } from "@/lib/blog/data";
import { cn } from "@/lib/cn";

function Block({
  post,
  direction,
  lang,
}: {
  post: PostSummary;
  direction: "previous" | "next";
  lang: Lang;
}) {
  const m = getMessages(lang).blog.post;
  const next = direction === "next";
  return (
    <Link
      href={`/${post.slug}`}
      aria-label={format(next ? m.nextPost : m.previousPost, {
        title: post.title,
      })}
      lang={post.lang !== lang ? post.lang : undefined}
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
        {next ? m.next : m.previous}
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
  lang,
}: {
  previous: PostSummary | null;
  next: PostSummary | null;
  lang: Lang;
}) {
  if (!previous && !next) return null;
  return (
    <nav
      aria-label={getMessages(lang).blog.post.moreLabel}
      className="grid border-y border-border md:grid-cols-2 md:divide-x md:divide-border max-md:divide-y max-md:divide-border"
    >
      <div>
        {previous && <Block post={previous} direction="previous" lang={lang} />}
      </div>
      <div>{next && <Block post={next} direction="next" lang={lang} />}</div>
    </nav>
  );
}
