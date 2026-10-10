import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ComingSoon } from "@/components/shared/ComingSoon";
import { Container } from "@/components/shared/Container";
import { JsonLd } from "@/components/shared/JsonLd";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { Newsletter } from "@/components/blog/Newsletter";
import { PostItem } from "@/components/blog/PostItem";
import { PostList } from "@/components/blog/PostList";
import { getMessages } from "@/content/messages";
import { getCachedPosts } from "@/lib/blog/cache";
import { blogJsonLd } from "@/lib/blog/seo";
import { isLang } from "@/lib/i18n";
import { siteOrigin, homeAlternates } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/sites/blog/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  // The home page's hreflang set; the layout's metadata is for every page.
  return isLang(lang) ? { alternates: homeAlternates("blog", lang) } : {};
}

// The blog's front page (design.md §14.13): every published post, newest first. On
// the French blog every post is listed; one without French is marked "EN" and read
// in English (docs/i18n.md §5). With none yet it is the coming-soon page (§14.12).
export default async function BlogHome({
  params,
}: PageProps<"/sites/blog/[lang]">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const posts = await getCachedPosts(lang);
  if (posts.length === 0) return <ComingSoon site="blog" lang={lang} />;
  const m = getMessages(lang).blog.home;

  return (
    <div className="pt-28 pb-24 md:pb-40">
      <JsonLd data={blogJsonLd(siteOrigin("blog"), lang)} />
      <Container>
        <SectionHeading
          as="h1"
          label={m.label}
          title={m.title}
          intro={m.intro}
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
      <Container className="mt-24 md:mt-32">
        <Newsletter lang={lang} />
      </Container>
    </div>
  );
}
