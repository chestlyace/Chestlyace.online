import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/shared/Container";
import { JsonLd } from "@/components/shared/JsonLd";
import { Reveal } from "@/components/shared/Reveal";
import { PostHeader } from "@/components/blog/PostHeader";
import { ReactionBar } from "@/components/blog/ReactionBar";
import { siteUrl } from "@/lib/sites";
import { PostNavigation } from "@/components/blog/PostNavigation";
import { Prose } from "@/components/blog/Prose";
import { TableOfContents } from "@/components/blog/TableOfContents";
import { proseComponents } from "@/components/blog/proseComponents";
import { getCachedPost, getCachedPosts } from "@/lib/blog/cache";
import { renderMarkdown } from "@/lib/blog/markdown";
import { blogPostingJsonLd } from "@/lib/blog/seo";
import { pageMetadata } from "@/lib/seo";

export async function generateStaticParams() {
  return (await getCachedPosts()).map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/sites/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const page = await getCachedPost(slug);
  if (!page) return {};
  const { post } = page;
  return pageMetadata("blog", {
    path: `/${post.slug}`,
    title: `${post.title} — Chestly Ace`,
    description: post.description,
    image: post.coverUrl,
    canonical: post.canonicalUrl,
    article: {
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      tags: post.tags,
    },
  });
}

// One post (design.md §14.14): header, cover, the prose with its contents rail,
// and the way on to the next post. Comments and the newsletter box come with
// their own steps.
export default async function PostPage({
  params,
}: PageProps<"/sites/blog/[slug]">) {
  const { slug } = await params;
  const page = await getCachedPost(slug);
  if (!page) notFound();
  const { post, previous, next } = page;

  const { content, toc } = await renderMarkdown(post.content, proseComponents);

  return (
    <div className="pt-28 pb-24 md:pb-40">
      <JsonLd data={blogPostingJsonLd(post)} />
      <Container>
        <div className="lg:max-w-[calc(100%*10/12)]">
          <PostHeader post={post} />
        </div>

        {post.coverUrl && (
          <Reveal y={24} className="mt-12">
            {/* eslint-disable-next-line @next/next/no-img-element -- Cloudinary or site address */}
            <img
              src={post.coverUrl}
              alt={post.coverAlt ?? ""}
              className="aspect-[16/9] w-full rounded-lg bg-tile object-cover sm:rounded-xl"
            />
          </Reveal>
        )}

        <div className="mt-12 grid gap-8 lg:grid-cols-12 lg:gap-x-8">
          {toc.length >= 3 && (
            <div className="lg:col-span-3 lg:col-start-10 lg:row-start-1">
              <TableOfContents items={toc} />
            </div>
          )}
          <article className="min-w-0 lg:col-span-8">
            <Prose>{content}</Prose>
          </article>
        </div>

        <div className="mt-8 lg:max-w-[calc(100%*8/12)]">
          <ReactionBar
            slug={post.slug}
            title={post.title}
            url={post.canonicalUrl ?? siteUrl("blog", `/${post.slug}`)}
            initialCount={post.likeCount}
          />
        </div>

        <div className="mt-24 md:mt-24">
          <PostNavigation previous={previous} next={next} />
        </div>
      </Container>
    </div>
  );
}
