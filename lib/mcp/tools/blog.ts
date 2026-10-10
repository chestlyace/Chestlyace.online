import { eq } from "drizzle-orm";
import { z } from "zod";
import { blogPosts } from "@/db/schema";
import {
  createPost,
  deletePost,
  duplicatePost,
  getPost,
  listPosts,
  publishProblems,
  updatePost,
  type BlogPost,
} from "@/lib/admin/blogApi";
import {
  deleteComment,
  listForModeration,
  setCommentStatus,
} from "@/lib/admin/commentsApi";
import { findProblems } from "@/lib/blog/markdown";
import type { Database } from "@/lib/db";
import { publishedBlog } from "../revalidate";
import { hasScope } from "../scopes";
import {
  ToolError,
  defineTool,
  refuse,
  requireConfirm,
  type AnyTool,
  type Caller,
} from "../tool";

// The blog tools (docs/mcp.md §5). They call the admin's own logic, so a post is held to
// the same rules as in the editor. Guard rails: a post is created and kept as a draft
// unless the token has `publish`; going live, taking down and switching the French
// version on or off need `publish`; deleting needs the post's slug in `confirm`.

const postId = z
  .number()
  .int()
  .positive()
  .describe("The post's id (blog_list)");

const fields = {
  title: z.string().describe("Title, up to 120 characters"),
  slug: z
    .string()
    .describe("Address: lowercase letters, numbers and hyphens, unique"),
  description: z.string().describe("Summary of up to 300 characters"),
  content: z
    .string()
    .describe(
      "The post as Markdown with the blog's blocks. Read get_guide blog_markdown first",
    ),
  coverUrl: z
    .string()
    .nullable()
    .describe("Cover picture address from media_upload_*, or null"),
  coverAlt: z.string().nullable().describe("The cover's description"),
  tags: z.array(z.string()).describe("Up to 8 tags"),
  commentsEnabled: z.boolean(),
  canonicalUrl: z
    .string()
    .nullable()
    .describe("Original address, if first published elsewhere"),
  series: z.string().nullable(),
  publishedAt: z
    .string()
    .nullable()
    .describe("Publishing date (ISO), optional"),
  translations: z
    .object({ fr: z.record(z.string(), z.unknown()).optional() })
    .describe(
      "French version: { fr: { title, description, content, coverAlt, series, published } }. See get_guide languages. `published` needs the publish scope",
    ),
};

function summarise(post: BlogPost) {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    status: post.status,
    publishedAt: post.publishedAt?.toISOString() ?? null,
  };
}

function frenchLive(post: { translations: { fr?: Record<string, unknown> } }) {
  return post.translations.fr?.published === true;
}

async function byIdOrFail(db: Database, id: number) {
  const post = await getPost(db, id);
  if (!post)
    throw new ToolError("No post with that id. Use blog_list to see them.");
  return post;
}

function needPublish(caller: Caller, action: string) {
  if (!hasScope(caller.scopes, "publish"))
    throw new ToolError(
      `${action} needs the publish scope, which this token does not have. The post is saved as a draft; ask the owner to publish it.`,
    );
}

/** The French block as sent, keeping its live switch unless the call sets it. */
function mergeFrench(
  current: BlogPost,
  sent: { fr?: Record<string, unknown> } | undefined,
  caller: Caller,
) {
  if (!sent?.fr) return sent;
  const fr = { ...sent.fr };
  if (fr.published === undefined) {
    if (current.translations.fr?.published !== undefined)
      fr.published = current.translations.fr.published;
  } else if (fr.published !== frenchLive(current)) {
    needPublish(caller, "Switching the French version on or off");
  }
  return { fr };
}

const list = defineTool({
  name: "blog_list",
  title: "List blog posts",
  description:
    "Every post, newest first: id, title, slug, draft/published, dates, likes, comments, and whether its French version is live, waiting or absent.",
  scope: "read",
  write: false,
  input: {
    status: z.enum(["all", "draft", "published"]).default("all"),
  },
  async run({ status }, { db }) {
    const items = (await listPosts(db)).filter(
      (post) => status === "all" || post.status === status,
    );
    return { summary: `Listed ${items.length} posts`, data: { items } };
  },
});

const get = defineTool({
  name: "blog_get",
  title: "Read a blog post",
  description: "One post in full (Markdown included), by id or by slug.",
  scope: "read",
  write: false,
  input: {
    id: postId.optional(),
    slug: z.string().optional().describe("The post's address, instead of id"),
  },
  async run({ id, slug }, { db }) {
    if (id === undefined && !slug)
      throw new ToolError("Send either id or slug.");
    const post =
      id !== undefined
        ? await getPost(db, id)
        : ((
            await db
              .select()
              .from(blogPosts)
              .where(eq(blogPosts.slug, slug!))
              .limit(1)
          )[0] ?? null);
    if (!post) throw new ToolError("No such post. Use blog_list to see them.");
    return { summary: `Read post ${post.slug}`, data: post };
  },
});

const validate = defineTool({
  name: "blog_validate",
  title: "Check a post before saving",
  description:
    "Checks Markdown (and a description) against the rules for going live, without saving: broken blocks, images missing alt text, quizzes without an answer. Returns the problems with their level.",
  scope: "read",
  write: false,
  input: {
    content: fields.content,
    description: z.string().optional(),
    frenchContent: z
      .string()
      .optional()
      .describe("The French body, to check too"),
  },
  async run({ content, description, frenchContent }) {
    const problems = findProblems(content);
    const french = frenchContent ? findProblems(frenchContent) : [];
    const blocking = publishProblems({
      description: description ?? "x",
      content,
      translations: frenchContent
        ? { fr: { published: true, content: frenchContent } }
        : null,
    });
    return {
      summary: "Checked a post's text",
      data: {
        canPublish: Object.keys(blocking).length === 0,
        blocking,
        problems,
        frenchProblems: french,
      },
    };
  },
});

const create = defineTool({
  name: "blog_create",
  title: "Create a blog post",
  description:
    "Creates a post as a DRAFT. Needs title, slug, description and content; everything else is optional. Use blog_publish to put it live (needs the publish scope).",
  scope: "write",
  write: true,
  input: {
    title: fields.title,
    slug: fields.slug,
    description: fields.description.optional(),
    content: fields.content.optional(),
    coverUrl: fields.coverUrl.optional(),
    coverAlt: fields.coverAlt.optional(),
    tags: fields.tags.optional(),
    commentsEnabled: fields.commentsEnabled.optional(),
    canonicalUrl: fields.canonicalUrl.optional(),
    series: fields.series.optional(),
    translations: fields.translations.optional(),
  },
  async run(args, { db, caller }) {
    const fr = args.translations?.fr;
    if (fr?.published === true)
      needPublish(caller, "Switching the French version on");
    const result = await createPost(db, { ...args, status: "draft" });
    if (!result.ok) refuse(result, "post");
    publishedBlog();
    return {
      summary: `Created draft ${result.post.slug}`,
      data: summarise(result.post),
    };
  },
});

const update = defineTool({
  name: "blog_update",
  title: "Change a blog post",
  description:
    "Changes the fields you send; the rest stay. A live post stays live and its changes show at once. To put it live or take it down use blog_publish / blog_unpublish.",
  scope: "write",
  write: true,
  input: {
    id: postId,
    title: fields.title.optional(),
    slug: fields.slug.optional(),
    description: fields.description.optional(),
    content: fields.content.optional(),
    coverUrl: fields.coverUrl.optional(),
    coverAlt: fields.coverAlt.optional(),
    tags: fields.tags.optional(),
    commentsEnabled: fields.commentsEnabled.optional(),
    canonicalUrl: fields.canonicalUrl.optional(),
    series: fields.series.optional(),
    publishedAt: fields.publishedAt.optional(),
    translations: fields.translations.optional(),
  },
  async run({ id, ...changes }, { db, caller }) {
    const current = await byIdOrFail(db, id);
    const body: Record<string, unknown> = { ...changes };
    if (changes.translations)
      body.translations = mergeFrench(current, changes.translations, caller);
    if (changes.publishedAt !== undefined && current.status === "published")
      needPublish(caller, "Changing a live post's date");
    const result = await updatePost(db, id, body);
    if (!result.ok) refuse(result, "post");
    publishedBlog();
    return {
      summary: `Updated post ${result.post.slug}`,
      data: summarise(result.post),
    };
  },
});

const publish = defineTool({
  name: "blog_publish",
  title: "Publish a blog post",
  description:
    "Puts a draft live. Fails with the reasons if the post is not whole (no description, a broken block). Set `french` to also switch the French version on.",
  scope: "publish",
  write: true,
  alsoNeeds: ["write"],
  input: { id: postId, french: z.boolean().optional() },
  async run({ id, french }, { db }) {
    const current = await byIdOrFail(db, id);
    const body: Record<string, unknown> = { status: "published" };
    if (french && current.translations.fr)
      body.translations = {
        fr: { ...current.translations.fr, published: true },
      };
    const result = await updatePost(db, id, body);
    if (!result.ok) refuse(result, "post");
    publishedBlog();
    return {
      summary: `Published ${result.post.slug}`,
      data: summarise(result.post),
    };
  },
});

const unpublish = defineTool({
  name: "blog_unpublish",
  title: "Take a blog post down",
  description: "Turns a live post back into a draft (it keeps its date).",
  scope: "publish",
  write: true,
  alsoNeeds: ["write"],
  input: { id: postId },
  async run({ id }, { db }) {
    await byIdOrFail(db, id);
    const result = await updatePost(db, id, { status: "draft" });
    if (!result.ok) refuse(result, "post");
    publishedBlog();
    return {
      summary: `Unpublished ${result.post.slug}`,
      data: summarise(result.post),
    };
  },
});

const duplicate = defineTool({
  name: "blog_duplicate",
  title: "Copy a blog post",
  description: "Makes a draft copy (“Copy of …”) with its own address.",
  scope: "write",
  write: true,
  input: { id: postId },
  async run({ id }, { db }) {
    const result = await duplicatePost(db, id);
    if (!result.ok) refuse(result, "post");
    publishedBlog();
    return {
      summary: `Copied to ${result.post.slug}`,
      data: summarise(result.post),
    };
  },
});

const remove = defineTool({
  name: "blog_delete",
  title: "Delete a blog post",
  description:
    "Permanently deletes a post with its likes and comments. Send the post's slug in `confirm`.",
  scope: "delete",
  write: true,
  hints: { destructive: true },
  input: { id: postId, confirm: z.string().describe("The post's exact slug") },
  async run({ id, confirm }, { db }) {
    const post = await byIdOrFail(db, id);
    requireConfirm(confirm, post.slug, "post");
    const result = await deletePost(db, id);
    if (!result.ok) refuse(result, "post");
    publishedBlog();
    return {
      summary: `Deleted post ${post.slug}`,
      data: { deleted: post.slug },
    };
  },
});

const comments = defineTool({
  name: "blog_comments_list",
  title: "List comments",
  description:
    "Comments for moderation, newest first (up to 200): the text, the post, the reader, reports and replies.",
  scope: "read",
  write: false,
  input: { filter: z.enum(["all", "reported", "hidden"]).default("all") },
  async run({ filter }, { db }) {
    const items = await listForModeration(db, filter);
    return { summary: `Listed ${items.length} comments`, data: { items } };
  },
});

const setStatus = (status: "hidden" | "visible") =>
  defineTool({
    name: status === "hidden" ? "blog_comment_hide" : "blog_comment_restore",
    title: status === "hidden" ? "Hide a comment" : "Show a hidden comment",
    description:
      status === "hidden"
        ? "Hides a comment from readers (it can be restored)."
        : "Shows a hidden comment again.",
    scope: "delete",
    write: true,
    input: { id: z.number().int().positive().describe("The comment's id") },
    async run({ id }, { db }) {
      if (!(await setCommentStatus(db, id, status)))
        throw new ToolError("No comment with that id. Use blog_comments_list.");
      publishedBlog();
      return { summary: `Comment ${id} ${status}`, data: { id, status } };
    },
  });

const removeComment = defineTool({
  name: "blog_comment_delete",
  title: "Delete a comment",
  description:
    "Permanently deletes a comment and its replies. Send its id as text in `confirm`.",
  scope: "delete",
  write: true,
  hints: { destructive: true },
  input: {
    id: z.number().int().positive(),
    confirm: z.string().describe("The comment's id, as text"),
  },
  async run({ id, confirm }, { db }) {
    requireConfirm(confirm, String(id), "comment");
    if (!(await deleteComment(db, id)))
      throw new ToolError("No comment with that id. Use blog_comments_list.");
    publishedBlog();
    return { summary: `Deleted comment ${id}`, data: { deleted: id } };
  },
});

export const blogTools: AnyTool[] = [
  list,
  get,
  validate,
  create,
  update,
  publish,
  unpublish,
  duplicate,
  remove,
  comments,
  setStatus("hidden"),
  setStatus("visible"),
  removeComment,
];
