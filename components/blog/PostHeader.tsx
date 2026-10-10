import { SectionHeading } from "@/components/shared/SectionHeading";
import { Reveal } from "@/components/shared/Reveal";
import { TagLink } from "@/components/shared/Tag";
import { TextLink } from "@/components/shared/TextLink";
import { getMessages } from "@/content/messages";
import { metaParts } from "@/lib/blog/format";
import type { PostSummary } from "@/lib/blog/data";
import type { Lang } from "@/lib/i18n";
import { plural } from "@/lib/i18n/format";

// The top of a post page (design.md §13.28): back link, meta row, title,
// description and tags.
export function PostHeader({
  post,
  lang,
}: {
  post: PostSummary;
  /** The language of the page; the post may be in the other one. */
  lang: Lang;
}) {
  const m = getMessages(lang).blog;
  const { published, updated, reading } = metaParts(post, m.meta.minRead);
  const textLang = post.lang !== lang ? post.lang : undefined;
  return (
    <header>
      <TextLink href="/" icon="left" className="flex-row-reverse">
        {m.post.allPosts}
      </TextLink>
      <SectionHeading
        as="h1"
        size="lg"
        className="mt-6"
        label={
          <>
            <time dateTime={post.publishedAt}>{published}</time>
            {" · "}
            <span
              aria-label={plural(m.meta.minuteRead, post.readingMinutes, lang)}
            >
              {reading}
            </span>
            {updated && (
              <>
                {` · ${m.meta.updated} `}
                <time dateTime={post.updatedAt}>{updated}</time>
              </>
            )}
          </>
        }
        title={post.title}
        intro={post.description}
        lang={textLang}
      />
      {post.tags.length > 0 && (
        <Reveal y={16} className="mt-6">
          <ul aria-label={m.post.tags} className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <li key={tag}>
                <TagLink href={`/tags/${tag}`}>{tag}</TagLink>
              </li>
            ))}
          </ul>
        </Reveal>
      )}
    </header>
  );
}
