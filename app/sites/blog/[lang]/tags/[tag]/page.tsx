import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/shared/Container";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { TextLink } from "@/components/shared/TextLink";
import { Newsletter } from "@/components/blog/Newsletter";
import { PostItem } from "@/components/blog/PostItem";
import { PostList } from "@/components/blog/PostList";
import { getMessages } from "@/content/messages";
import { getCachedPostsByTag, getCachedTags } from "@/lib/blog/cache";
import { isLang } from "@/lib/i18n";
import { format, plural } from "@/lib/i18n/format";
import { pageMetadata } from "@/lib/seo";

export async function generateStaticParams() {
  return (await getCachedTags("en")).map(({ tag }) => ({ tag }));
}

export async function generateMetadata({
  params,
}: PageProps<"/sites/blog/[lang]/tags/[tag]">): Promise<Metadata> {
  const { lang, tag } = await params;
  if (!isLang(lang)) return {};
  const posts = await getCachedPostsByTag(tag, lang);
  if (posts.length === 0) return {};
  const m = getMessages(lang).blog.tags;
  return pageMetadata("blog", {
    path: `/tags/${tag}`,
    title: format(m.tagTitle, { tag }),
    description: format(m.tagDescription, { tag }),
    lang,
  });
}

// The posts with one tag (design.md §14.15); on the French blog, the ones with French.
export default async function TagPage({
  params,
}: PageProps<"/sites/blog/[lang]/tags/[tag]">) {
  const { lang, tag } = await params;
  if (!isLang(lang)) notFound();
  const posts = await getCachedPostsByTag(tag, lang);
  if (posts.length === 0) notFound();
  const m = getMessages(lang).blog.tags;

  return (
    <div className="pt-28 pb-24 md:pb-40">
      <Container>
        <SectionHeading
          as="h1"
          label={m.tagLabel}
          title={tag}
          intro={plural(m.posts, posts.length, lang)}
        />
      </Container>
      <PostList className="mt-14 flex flex-col gap-16 md:mt-20 md:gap-24">
        {posts.map((post, index) => (
          <PostItem
            key={post.slug}
            post={post}
            latest={index === 0}
            lang={lang}
          />
        ))}
      </PostList>
      <Container className="mt-16 md:mt-24">
        <TextLink href="/tags" icon="right">
          {m.allTags}
        </TextLink>
      </Container>
      <Container className="mt-24 md:mt-32">
        <Newsletter lang={lang} />
      </Container>
    </div>
  );
}
