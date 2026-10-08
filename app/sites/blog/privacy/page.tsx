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
// when the text changes, and when the newsletter opens (9b.7).
const UPDATED = "8 October 2026";

const TEXT = `
This blog keeps very little about you. This page says what, and why.

## What is stored

- **Likes.** When you like a post, your browser gets a cookie called \`blog_visitor\` holding a random code. I keep only a scrambled (hashed) copy of it next to the post, so a like counts once. It can't be turned back into the code, and it says nothing about who you are.
- **Your account, if you sign in to comment.** GitHub or Google shares your **name, email address and profile picture** with me, and I store them. A sign-in cookie (\`reader.session_token\`) keeps you signed in for up to 30 days.
- **Your comments**, the likes you give to comments, and any comments you report.
- **Newsletter.** There is no newsletter signup yet. This page will say what is kept before one opens.

## Why

To make likes count once, to let you comment, to keep you signed in, and so I can tell who wrote what and deal with spam or abuse. Nothing is used for advertising, and nothing is sold.

## Who sees it

- Your **name, picture and comments are public**, next to your comments.
- Your **email address is never shown** to other readers. Only I can see it.
- When someone comments, I get an email with their name and their comment (not their email address). The site runs on Vercel, with its database and the email service Resend, which handle this data for me.

## How long

- The likes cookie lasts a year.
- A sign-in lasts up to 30 days.
- Your account and comments stay until you delete them or I remove them.

## Deleting your data

Sign in, open the menu on your name under the comments, and choose **Delete my account**. That removes your name, email address, picture, sign-in and your likes on comments. Your comments stay, shown as "Deleted user"; you can delete each of them yourself first. If you would like something else removed, ask me.

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
