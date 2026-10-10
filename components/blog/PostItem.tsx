import { ArrowUpRight } from "lucide-react";
import { Link } from "@/components/shared/Link";
import { cn } from "@/lib/cn";
import { metaParts } from "@/lib/blog/format";
import type { PostSummary } from "@/lib/blog/data";
import { Container } from "@/components/shared/Container";
import { Tag } from "@/components/shared/Tag";
import { getMessages } from "@/content/messages";
import type { Lang } from "@/lib/i18n";

// One post in a list (design.md §13.27, after linear.app/blog): a big cover, a
// mono meta line, the title with an arrow, the description. The whole item is
// one link; the latest post is wider and its title larger.
export function PostItem({
  post,
  latest = false,
  lang,
}: {
  post: PostSummary;
  latest?: boolean;
  /** The language of the page; a post in the other one is marked and tagged. */
  lang: Lang;
}) {
  const m = getMessages(lang).blog;
  const { published, reading } = metaParts(post, m.meta.minRead);
  // On the French blog a post without French is in English (docs/i18n.md §5).
  const foreign = post.lang !== lang;
  const textLang = foreign ? post.lang : undefined;
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
              {foreign && (
                <>
                  {" · "}
                  <Tag
                    aria-label={m.onlyEnglish.markLabel}
                    className="ml-1 h-5 px-1.5"
                  >
                    {m.onlyEnglish.mark}
                  </Tag>
                </>
              )}
            </p>
            <div className="mt-2 flex items-start justify-between gap-4">
              <h2
                lang={textLang}
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
            <p
              lang={textLang}
              className="mt-3 line-clamp-2 max-w-[52ch] text-lead text-muted sm:line-clamp-none"
            >
              {post.description}
            </p>
          </div>
        </Link>
      </Container>
    </li>
  );
}
