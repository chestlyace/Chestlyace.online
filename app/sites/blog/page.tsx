import { ComingSoon } from "@/components/shared/ComingSoon";
import { Container } from "@/components/shared/Container";
import { JsonLd } from "@/components/shared/JsonLd";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { NewsletterBox } from "@/components/blog/NewsletterBox";
import { PostItem } from "@/components/blog/PostItem";
import { PostList } from "@/components/blog/PostList";
import { getCachedPosts } from "@/lib/blog/cache";
import { blogJsonLd } from "@/lib/blog/seo";

// The blog's front page (design.md §14.13): every published post, newest first.
// With none yet it is the coming-soon page (§14.12).
export default async function BlogHome() {
  const posts = await getCachedPosts();
  if (posts.length === 0) return <ComingSoon site="blog" />;

  return (
    <div className="pt-28 pb-24 md:pb-40">
      <JsonLd data={blogJsonLd()} />
      <Container>
        <SectionHeading
          as="h1"
          label="Blog"
          title="Blog"
          intro="Writing on software engineering, web development, and building things."
        />
      </Container>
      <PostList className="mt-14 flex flex-col gap-16 md:mt-20 md:gap-24">
        {posts.map((post, index) => (
          <PostItem key={post.slug} post={post} latest={index === 0} />
        ))}
      </PostList>
      <Container className="mt-24 md:mt-32">
        <NewsletterBox />
      </Container>
    </div>
  );
}
