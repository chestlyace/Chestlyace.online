import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/shared/Container";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { TextLink } from "@/components/shared/TextLink";
import { Newsletter } from "@/components/blog/Newsletter";
import { PostItem } from "@/components/blog/PostItem";
import { PostList } from "@/components/blog/PostList";
import { getCachedPostsByTag, getCachedTags } from "@/lib/blog/cache";
import { pageMetadata } from "@/lib/seo";

export async function generateStaticParams() {
  return (await getCachedTags()).map(({ tag }) => ({ tag }));
}

export async function generateMetadata({
  params,
}: PageProps<"/sites/blog/[lang]/tags/[tag]">): Promise<Metadata> {
  const { tag } = await params;
  const posts = await getCachedPostsByTag(tag);
  if (posts.length === 0) return {};
  return pageMetadata("blog", {
    path: `/tags/${tag}`,
    title: `Posts tagged ${tag} — Chestly Ace`,
    description: `Posts on the blog tagged ${tag}.`,
  });
}

// The posts with one tag (design.md §14.15).
export default async function TagPage({
  params,
}: PageProps<"/sites/blog/[lang]/tags/[tag]">) {
  const { tag } = await params;
  const posts = await getCachedPostsByTag(tag);
  if (posts.length === 0) notFound();

  return (
    <div className="pt-28 pb-24 md:pb-40">
      <Container>
        <SectionHeading
          as="h1"
          label="Tag"
          title={tag}
          intro={`${posts.length} ${posts.length === 1 ? "post" : "posts"}`}
        />
      </Container>
      <PostList className="mt-14 flex flex-col gap-16 md:mt-20 md:gap-24">
        {posts.map((post, index) => (
          <PostItem key={post.slug} post={post} latest={index === 0} />
        ))}
      </PostList>
      <Container className="mt-16 md:mt-24">
        <TextLink href="/tags" icon="right">
          All tags
        </TextLink>
      </Container>
      <Container className="mt-24 md:mt-32">
        <Newsletter />
      </Container>
    </div>
  );
}
