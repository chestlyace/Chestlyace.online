import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/shared/Container";
import { JsonLd } from "@/components/shared/JsonLd";
import { Reveal } from "@/components/shared/Reveal";
import { Comments } from "@/components/blog/comments/Comments";
import { Newsletter } from "@/components/blog/Newsletter";
import { PostHeader } from "@/components/blog/PostHeader";
import { ReactionBar } from "@/components/blog/ReactionBar";
import { siteUrl } from "@/lib/sites";
import { PostNavigation } from "@/components/blog/PostNavigation";
import { Prose } from "@/components/blog/Prose";
import { TableOfContents } from "@/components/blog/TableOfContents";
import { proseComponentsFor } from "@/components/blog/proseComponents";
import { getCachedPost, getCachedPosts } from "@/lib/blog/cache";
import { renderMarkdown } from "@/lib/blog/markdown";
import { blogPostingJsonLd } from "@/lib/blog/seo";
import { getMessages } from "@/content/messages";
import { isLang, localizedPath } from "@/lib/i18n";
import { format } from "@/lib/i18n/format";
import { pageMetadata } from "@/lib/seo";

export async function generateStaticParams() {
  return (await getCachedPosts("en")).map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/sites/blog/[lang]/[slug]">): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isLang(lang)) return {};
  const page = await getCachedPost(slug, lang);
  if (!page) return {};
  const { post } = page;
  return pageMetadata("blog", {
    path: `/${post.slug}`,
    // A post without French, read on the French blog, is the English page: it is
    // described, and its canonical address given, as the English one.
    lang: post.lang,
    title: format(getMessages(post.lang).blog.post.title, {
      title: post.title,
    }),
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
// and the way on to the next post. The newsletter box comes with its own step.
export default async function PostPage({
  params,
}: PageProps<"/sites/blog/[lang]/[slug]">) {
  const { lang, slug } = await params;
  if (!isLang(lang)) notFound();
  const page = await getCachedPost(slug, lang);
  if (!page) notFound();
  const { post, previous, next } = page;
  const m = getMessages(lang).blog;
  // Only English: the text is read in English on the French blog, and says so.
  const textLang = post.lang !== lang ? post.lang : undefined;

  const { content, toc } = await renderMarkdown(
    post.content,
    proseComponentsFor(lang),
  );

  return (
    <div className="pt-28 pb-24 md:pb-40">
      <JsonLd data={blogPostingJsonLd(post)} />
      <Container>
        <div className="lg:max-w-[calc(100%*10/12)]">
          <PostHeader post={post} lang={lang} />
        </div>

        {textLang && (
          <p
            role="note"
            className="mt-8 rounded-md bg-tile px-4 py-3 text-sm text-muted lg:max-w-[calc(100%*8/12)]"
          >
            {m.onlyEnglish.notice}
          </p>
        )}

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
              <TableOfContents items={toc} label={m.post.onThisPage} />
            </div>
          )}
          <article className="min-w-0 lg:col-span-8" lang={textLang}>
            <Prose>{content}</Prose>
          </article>
        </div>

        <div className="mt-8 lg:max-w-[calc(100%*8/12)]">
          <ReactionBar
            slug={post.slug}
            title={post.title}
            url={
              post.canonicalUrl ??
              siteUrl("blog", localizedPath(`/${post.slug}`, post.lang))
            }
            initialCount={post.likeCount}
            lang={lang}
            reactions={m.reactions}
            share={m.share}
          />
        </div>

        <div className="mt-24 md:mt-24">
          <PostNavigation previous={previous} next={next} lang={lang} />
        </div>

        <Newsletter lang={lang} className="mt-24" />

        {post.commentsEnabled && (
          <div className="mt-16 md:mt-24 lg:max-w-[calc(100%*8/12)]">
            <Comments
              slug={post.slug}
              lang={lang}
              text={m.comments}
              signIn={m.signIn}
            />
          </div>
        )}
      </Container>
    </div>
  );
}
