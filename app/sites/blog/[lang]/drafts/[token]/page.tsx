import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { Container } from "@/components/shared/Container";
import { Reveal } from "@/components/shared/Reveal";
import { DraftBanner } from "@/components/blog/DraftBanner";
import { DraftFeedback } from "@/components/blog/DraftFeedback";
import { PostHeader } from "@/components/blog/PostHeader";
import { Prose } from "@/components/blog/Prose";
import { TableOfContents } from "@/components/blog/TableOfContents";
import { proseComponentsFor } from "@/components/blog/proseComponents";
import { getMessages } from "@/content/messages";
import { getSharedDraft } from "@/lib/blog/drafts";
import { feedbackMaxWords } from "@/lib/blog/feedbackText";
import { renderMarkdown } from "@/lib/blog/markdown";
import { getDb } from "@/lib/db";
import { isLang, localizedPath, type Lang } from "@/lib/i18n";
import { format } from "@/lib/i18n/format";
import { imagePath } from "@/lib/seo";

// A draft opened through its share link (design.md §14.27, D93). Read on every
// request, never cached: it shows the last saved version, a turned-off link stops at
// once. proxy.ts adds the no-index, no-referrer and no-store headers.
export const dynamic = "force-dynamic";

// The metadata and the page read the same draft once per request.
const readDraft = cache((token: string, lang: Lang) =>
  getSharedDraft(getDb(), token, lang),
);

export async function generateMetadata({
  params,
}: PageProps<"/sites/blog/[lang]/drafts/[token]">): Promise<Metadata> {
  const { lang, token } = await params;
  if (!isLang(lang)) return {};
  const shared = await readDraft(token, lang);
  if (shared?.kind !== "draft") return {};
  const { post } = shared;
  const m = getMessages(lang).blog.draft;
  const images = post.coverUrl ? [{ url: imagePath(post.coverUrl) }] : [];
  return {
    title: format(m.title, { title: post.title }),
    description: post.description,
    robots: { index: false, follow: false },
    referrer: "no-referrer",
    // No canonical, no language alternates, no feed: the page is not public.
    alternates: {},
    openGraph: {
      type: "article",
      title: format(m.ogTitle, { title: post.title }),
      description: post.description,
      url: localizedPath(`/drafts/${token}`, lang),
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: format(m.ogTitle, { title: post.title }),
      description: post.description,
      images: images.map((image) => image.url),
    },
  };
}

// The post page (§14.14) with the draft banner on top and the private feedback form
// (§13.69) in the comments' place; no likes, post navigation or newsletter.
export default async function SharedDraftPage({
  params,
}: PageProps<"/sites/blog/[lang]/drafts/[token]">) {
  const { lang, token } = await params;
  if (!isLang(lang)) notFound();
  const shared = await readDraft(token, lang);
  if (!shared) notFound();
  // Published since it was shared: the link keeps working and opens the post.
  if (shared.kind === "published")
    redirect(localizedPath(`/${shared.slug}`, lang));

  const { post } = shared;
  const m = getMessages(lang).blog;
  const textLang = post.lang !== lang ? post.lang : undefined;
  const { content, toc } = await renderMarkdown(
    post.content,
    proseComponentsFor(lang),
  );

  return (
    <div className="pt-28 pb-24 md:pb-40">
      <Container>
        <div className="lg:max-w-[calc(100%*10/12)]">
          <DraftBanner
            savedAt={post.updatedAt}
            lang={lang}
            feedbackHref="#feedback"
          />
          <div className="mt-6 md:mt-8">
            <PostHeader post={post} lang={lang} />
          </div>
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

        <div className="mt-16 md:mt-24 lg:max-w-[calc(100%*8/12)]">
          <DraftFeedback
            token={token}
            lang={lang}
            maxWords={feedbackMaxWords()}
            text={m.draft.feedback}
          />
        </div>
      </Container>
    </div>
  );
}
