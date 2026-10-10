import { after } from "next/server";
import { z } from "zod";
import { configuredProviders, getReader } from "@/lib/blog/auth";
import { buildCommentEmail } from "@/lib/blog/commentMail";
import { guardWrite, reply } from "@/lib/blog/commentRoute";
import { maxWords } from "@/lib/blog/commentText";
import {
  commentContext,
  createComment,
  listComments,
} from "@/lib/blog/comments";
import { sendContactEmail } from "@/lib/contactMail";
import { getDb } from "@/lib/db";
import { getCachedHomepageData } from "@/lib/portfolio";
import { siteUrl } from "@/lib/sites";

// The comments of a post (design.md §13.37), loaded after the page. Answers on
// the blog host only (lib/sites.ts).
const body = z
  .object({
    body: z.string().max(10_000),
    parentId: z.number().int().positive().nullable().optional(),
  })
  .strict();

// GET: the next 20 comments (newest first), the count, and who is reading.
export async function GET(
  request: Request,
  { params }: RouteContext<"/api/blog/posts/[slug]/comments">,
) {
  const { slug } = await params;
  const reader = await getReader(request.headers);
  const cursor =
    Number(new URL(request.url).searchParams.get("cursor")) || null;
  const page = await listComments(getDb(), slug, {
    viewerId: reader?.id ?? null,
    cursor,
  });
  if (!page) return reply({ error: "not-found" }, 404);
  return reply({
    ...page,
    maxWords: maxWords(),
    providers: configuredProviders(),
    reader: reader && {
      id: reader.id,
      name: reader.name,
      image: reader.image,
      isAuthor: reader.isAuthor,
    },
  });
}

// POST: a comment or a reply, by a signed-in reader. It appears at once.
export async function POST(
  request: Request,
  { params }: RouteContext<"/api/blog/posts/[slug]/comments">,
) {
  const guard = await guardWrite(request, "comment");
  if ("response" in guard) return guard.response;
  const { reader } = guard;

  const parsed = body.safeParse(await request.json().catch(() => undefined));
  if (!parsed.success)
    return reply(
      { error: "invalid", code: "empty", message: "Write something first." },
      422,
    );

  const { slug } = await params;
  const db = getDb();
  const result = await createComment(
    db,
    {
      slug,
      userId: reader.id,
      body: parsed.data.body,
      parentId: parsed.data.parentId ?? null,
    },
    { maxWords: maxWords() },
  );
  if (!result.ok)
    return reply(
      {
        error: result.error,
        ...("message" in result
          ? {
              code: result.code,
              message: result.message,
              values: result.values,
            }
          : {}),
      },
      result.status,
    );

  // The owner hears about it (not about their own).
  if (!reader.isAuthor) {
    after(async () => {
      const apiKey = process.env.RESEND_API_KEY;
      const { profile } = await getCachedHomepageData();
      const to = process.env.CONTACT_TO_EMAIL || profile?.email;
      const post = await commentContext(db, result.postId);
      if (!apiKey || !to || !post) return;
      await sendContactEmail(
        buildCommentEmail(
          {
            postTitle: post.title,
            postUrl: siteUrl("blog", `/${post.slug}`),
            author: reader.name,
            body: result.comment.body,
            reply: result.comment.parentId !== null,
          },
          { to, from: process.env.CONTACT_FROM_EMAIL },
        ),
        apiKey,
      );
    });
  }
  return reply({ comment: result.comment }, 201);
}
