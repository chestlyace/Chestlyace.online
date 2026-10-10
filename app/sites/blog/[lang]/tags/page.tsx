import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/shared/Container";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { TagLink } from "@/components/shared/Tag";
import { Newsletter } from "@/components/blog/Newsletter";
import { getMessages } from "@/content/messages";
import { getCachedTags } from "@/lib/blog/cache";
import { isLang } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/sites/blog/[lang]/tags">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const m = getMessages(lang).blog.tags;
  return pageMetadata("blog", {
    path: "/tags",
    title: m.pageTitle,
    description: m.pageDescription,
    lang,
  });
}

// Every tag with its count (design.md §14.15); the French blog counts only the posts
// that have French.
export default async function TagsPage({
  params,
}: PageProps<"/sites/blog/[lang]/tags">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const tags = await getCachedTags(lang);
  if (tags.length === 0) notFound();
  const m = getMessages(lang).blog.tags;

  return (
    <div className="pt-28 pb-24 md:pb-40">
      <Container>
        <SectionHeading
          as="h1"
          label={m.label}
          title={m.title}
          intro={m.intro}
        />
        <ul
          aria-label={m.listLabel}
          className="mt-14 flex flex-wrap gap-3 md:mt-16"
        >
          {tags.map(({ tag, count }) => (
            <li key={tag}>
              <TagLink href={`/tags/${tag}`} className="h-8 px-3.5">
                {tag} · {count}
              </TagLink>
            </li>
          ))}
        </ul>
        <Newsletter lang={lang} className="mt-24 md:mt-32" />
      </Container>
    </div>
  );
}
