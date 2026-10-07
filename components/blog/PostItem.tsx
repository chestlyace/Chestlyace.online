import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { metaParts } from "@/lib/blog/format";
import type { PostSummary } from "@/lib/blog/data";
import { Container } from "@/components/shared/Container";

// One post in a list (design.md §13.27, after linear.app/blog): a big cover, a
// mono meta line, the title with an arrow, the description. The whole item is
// one link; the latest post is wider and its title larger.
export function PostItem({
  post,
  latest = false,
}: {
  post: PostSummary;
  latest?: boolean;
}) {
  const { published, reading } = metaParts(post);
  return (
    <li data-post className="list-none">
      <Container narrow={!latest}>
        <Link
          href={`/${post.slug}`}
          className="group/post block rounded-lg outline-none focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-ring"
        >
          <div
            data-post-media
            className="relative aspect-[16/9] overflow-hidden rounded-lg bg-tile sm:rounded-xl"
          >
            {post.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- Cloudinary or site address
              <img
                data-post-image
                src={post.coverUrl}
                alt=""
                loading="lazy"
                className="size-full object-cover transition-transform duration-[600ms] ease-out group-hover/post:scale-[1.04] motion-reduce:transition-none"
              />
            ) : (
              <span
                aria-hidden="true"
                className="absolute inset-0 grid place-items-center p-6 text-center font-display text-display-lg text-muted uppercase"
              >
                {post.title}
              </span>
            )}
          </div>

          <div data-post-text>
            <p className="type-label mt-5 text-muted">
              <time dateTime={post.publishedAt}>{published}</time>
              {" · "}
              {reading}
              {post.tags[0] && ` · ${post.tags[0]}`}
            </p>
            <div className="mt-2 flex items-start justify-between gap-4">
              <h2
                className={cn(
                  "font-display text-foreground uppercase transition-colors duration-150 group-hover/post:text-primary-text",
                  latest
                    ? "text-display-lg sm:text-display-xl"
                    : "text-display-lg",
                )}
              >
                {post.title}
              </h2>
              <ArrowUpRight
                className="mt-2 hidden size-6 shrink-0 text-muted transition-[transform,color] duration-150 ease-out group-hover/post:translate-x-1 group-hover/post:-translate-y-1 group-hover/post:text-foreground sm:block"
                aria-hidden="true"
              />
            </div>
            <p className="mt-3 line-clamp-2 max-w-[52ch] text-lead text-muted sm:line-clamp-none">
              {post.description}
            </p>
          </div>
        </Link>
      </Container>
    </li>
  );
}
