import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/shared/Button";
import { Container } from "@/components/shared/Container";
import { Reveal } from "@/components/shared/Reveal";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { getNewsletterCopy } from "@/lib/blog/data";
import { getDb } from "@/lib/db";
import { addSubscriber, verifyToken } from "@/lib/newsletterServer";
import { getMessages } from "@/content/messages";
import { isLang, localizedPath } from "@/lib/i18n";
import { siteUrl } from "@/lib/sites";

export async function generateMetadata({
  params,
}: PageProps<"/sites/blog/[lang]/newsletter/confirm">): Promise<Metadata> {
  const { lang } = await params;
  return {
    title: getMessages(isLang(lang) ? lang : "en").blog.newsletter.pageTitle,
    robots: { index: false, follow: false },
  };
}

// Where the link in the confirmation email lands (design.md §14.16): it checks the
// link, adds the address to the newsletter's segment, and shows the result in the
// coming-soon page's look. Not indexed.
export default async function ConfirmPage({
  params,
  searchParams,
}: PageProps<"/sites/blog/[lang]/newsletter/confirm">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const { token } = await searchParams;
  const secret = process.env.NEWSLETTER_SECRET;
  const apiKey = process.env.RESEND_API_KEY;
  const segmentId = process.env.RESEND_AUDIENCE_ID;

  const email =
    secret && typeof token === "string" ? verifyToken(token, secret) : null;
  const confirmed =
    !!email &&
    !!apiKey &&
    !!segmentId &&
    (await addSubscriber(email, { apiKey, segmentId }));
  const wording = await getNewsletterCopy(getDb(), lang);
  const copy = confirmed ? wording.confirmed : wording.failed;

  return (
    <div className="flex min-h-[30rem] flex-1 items-center pt-28 pb-24">
      <Container>
        <SectionHeading
          as="h1"
          label={copy.label}
          title={copy.title}
          intro={copy.lead}
        />
        <Reveal y={16} className="mt-10">
          <Button
            href={siteUrl("blog", localizedPath("/", lang))}
            size="lg"
            trailingIcon={<ArrowUpRight />}
            iconNudge="up-right"
            className="w-full sm:w-auto"
          >
            {copy.button}
          </Button>
        </Reveal>
      </Container>
    </div>
  );
}
