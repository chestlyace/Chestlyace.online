import { SectionHeading } from "@/components/shared/SectionHeading";
import { Reveal } from "@/components/shared/Reveal";
import { TagLink } from "@/components/shared/Tag";
import { TextLink } from "@/components/shared/TextLink";
import { metaParts } from "@/lib/blog/format";
import type { PostSummary } from "@/lib/blog/data";

// The top of a post page (design.md §13.28): back link, meta row, title,
// description and tags.
export function PostHeader({ post }: { post: PostSummary }) {
  const { published, updated, reading } = metaParts(post);
  return (
    <header>
      <TextLink href="/" icon="left" className="flex-row-reverse">
        All posts
      </TextLink>
      <SectionHeading
        as="h1"
        size="lg"
        className="mt-6"
        label={
          <>
            <time dateTime={post.publishedAt}>{published}</time>
            {" · "}
            <span aria-label={`${post.readingMinutes} minute read`}>
              {reading}
            </span>
            {updated && (
              <>
                {" · UPDATED "}
                <time dateTime={post.updatedAt}>{updated}</time>
              </>
            )}
          </>
        }
        title={post.title}
        intro={post.description}
      />
      {post.tags.length > 0 && (
        <Reveal y={16} className="mt-6">
          <ul aria-label="Tags" className="flex flex-wrap gap-2">
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
