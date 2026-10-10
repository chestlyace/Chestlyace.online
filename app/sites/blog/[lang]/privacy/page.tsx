import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Prose } from "@/components/blog/Prose";
import { proseComponentsFor } from "@/components/blog/proseComponents";
import { Container } from "@/components/shared/Container";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { getMessages } from "@/content/messages";
import { renderMarkdown } from "@/lib/blog/markdown";
import { LOCALES, isLang, localizedPath } from "@/lib/i18n";
import { format } from "@/lib/i18n/format";
import { pageMetadata } from "@/lib/seo";
import { siteUrl } from "@/lib/sites";

// What the blog stores, why, who sees it, how long, and how to delete it
// (design.md §14.18). The text and the date it was last changed are in the
// dictionaries (`blog.privacy`): update `updated` when the text changes.

export async function generateMetadata({
  params,
}: PageProps<"/sites/blog/[lang]/privacy">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const m = getMessages(lang).blog.privacy;
  return {
    ...pageMetadata("blog", {
      path: "/privacy",
      title: m.pageTitle,
      description: m.description,
      lang,
    }),
    // Not a page to find in search.
    robots: { index: false, follow: false },
  };
}

export default async function PrivacyPage({
  params,
}: PageProps<"/sites/blog/[lang]/privacy">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const m = getMessages(lang).blog.privacy;
  const { content } = await renderMarkdown(
    format(m.text, {
      contact: siteUrl("main", localizedPath("/#contact", lang)),
    }).trim(),
    proseComponentsFor(lang),
  );
  const date = new Intl.DateTimeFormat(LOCALES[lang], {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(m.updated));
  return (
    <div className="pt-28 pb-24 md:pb-40">
      <Container>
        <div className="max-w-[44rem]">
          <SectionHeading as="h1" label={m.label} title={m.title} />
          <p className="type-label mt-6 text-muted">
            {format(m.updatedLabel, { date })}
          </p>
          <div className="mt-10">
            <Prose>{content}</Prose>
          </div>
        </div>
      </Container>
    </div>
  );
}
