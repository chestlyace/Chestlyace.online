import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/shared/Container";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { TagLink } from "@/components/shared/Tag";
import { NewsletterBox } from "@/components/blog/NewsletterBox";
import { getCachedTags } from "@/lib/blog/cache";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata("blog", {
  path: "/tags",
  title: "Tags — Chestly Ace",
  description: "Browse the blog's posts by topic.",
});

// Every tag with its count (design.md §14.15).
export default async function TagsPage() {
  const tags = await getCachedTags();
  if (tags.length === 0) notFound();

  return (
    <div className="pt-28 pb-24 md:pb-40">
      <Container>
        <SectionHeading
          as="h1"
          label="Tags"
          title="Tags"
          intro="Browse posts by topic."
        />
        <ul aria-label="Tags" className="mt-14 flex flex-wrap gap-3 md:mt-16">
          {tags.map(({ tag, count }) => (
            <li key={tag}>
              <TagLink href={`/tags/${tag}`} className="h-8 px-3.5">
                {tag} · {count}
              </TagLink>
            </li>
          ))}
        </ul>
        <NewsletterBox className="mt-24 md:mt-32" />
      </Container>
    </div>
  );
}
