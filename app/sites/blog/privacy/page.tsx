import type { Metadata } from "next";
import { Prose } from "@/components/blog/Prose";
import { proseComponents } from "@/components/blog/proseComponents";
import { Container } from "@/components/shared/Container";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { renderMarkdown } from "@/lib/blog/markdown";
import { pageMetadata } from "@/lib/seo";
import { siteUrl } from "@/lib/sites";

// DRAFT WORDING for the owner's approval (design.md §14.18, Phase 9b.5b): what the
// blog stores, why, who sees it, how long, and how to delete it. Update the date
// when the text changes. The newsletter (9b.7) is covered below.
const UPDATED = "8 October 2026";

const TEXT = `
This blog keeps very little about you. This page says what, and why.

## What is stored

- **Likes.** When you like a post, your browser gets a cookie called \`blog_visitor\` holding a random code. I keep only a scrambled (hashed) copy of it next to the post, so a like counts once. It can't be turned back into the code, and it says nothing about who you are.
- **Your account, if you sign in to comment.** GitHub or Google shares your **name, email address and profile picture** with me, and I store them. A sign-in cookie (\`reader.session_token\`) keeps you signed in for up to 30 days.
- **Your comments**, the likes you give to comments, and any comments you report.
- **Newsletter.** If you subscribe, I keep your **email address** in Resend, the email service I send the newsletter with. It is not stored in this blog's own database. I only add it after you open the link in the confirmation email; if you never do, it is not kept.

## Why

To make likes count once, to let you comment, to keep you signed in, to email you new posts if you subscribe, and so I can tell who wrote what and deal with spam or abuse. Nothing is used for advertising, and nothing is sold.

## Who sees it

- Your **name, picture and comments are public**, next to your comments.
- Your **email address is never shown** to other readers. Only I can see it. The same goes for a newsletter address: only I and Resend see it, and I never share the list.
- When someone comments, I get an email with their name and their comment (not their email address). The site runs on Vercel, with its database and the email service Resend, which handle this data for me.

## How long

- The likes cookie lasts a year.
- A sign-in lasts up to 30 days.
- Your account and comments stay until you delete them or I remove them.
- A newsletter address stays until you unsubscribe.

## Deleting your data

Sign in, open the menu on your name under the comments, and choose **Delete my account**. That removes your name, email address, picture, sign-in and your likes on comments. Your comments stay, shown as "Deleted user"; you can delete each of them yourself first. Every newsletter email has an unsubscribe link, which stops the emails. If you would like your address removed from the list altogether, or anything else removed, ask me.

## Questions

Use the [contact form](${siteUrl("main", "/#contact")}) on my main site.
`;

export const metadata: Metadata = {
  ...pageMetadata("blog", {
    path: "/privacy",
    title: "Privacy — Chestly Ace",
    description: "What the blog stores about readers, and why.",
  }),
  // Not a page to find in search.
  robots: { index: false, follow: false },
};

export default async function PrivacyPage() {
  const { content } = await renderMarkdown(TEXT.trim(), proseComponents);
  return (
    <div className="pt-28 pb-24 md:pb-40">
      <Container>
        <div className="max-w-[44rem]">
          <SectionHeading as="h1" label="Privacy" title="Privacy" />
          <p className="type-label mt-6 text-muted">Last updated {UPDATED}</p>
          <div className="mt-10">
            <Prose>{content}</Prose>
          </div>
        </div>
      </Container>
    </div>
  );
}
