import { z } from "zod";
import { getPost } from "@/lib/admin/blogApi";
import { sharePost, unsharePost, type ShareLink } from "@/lib/admin/shareApi";
import {
  deleteFeedback,
  listFeedback,
  markFeedbackRead,
} from "@/lib/blog/draftFeedback";
import type { Database } from "@/lib/db";
import { siteUrl } from "@/lib/sites";
import {
  ToolError,
  defineTool,
  refuse,
  requireConfirm,
  type AnyTool,
} from "../tool";

// Shared drafts over MCP (D93, docs/mcp.md §5, shareable drafts S.4): the same share
// link and private feedback the editor's Share dialog and Feedback tab work with
// (design.md §13.70–13.71). Sharing shows an unpublished post to whoever holds the
// link, so turning it on or off needs `publish` (and `write`, as
// publishing does).

const postId = z
  .number()
  .int()
  .positive()
  .describe("The post's id (blog_list)");

async function draftOrFail(db: Database, id: number) {
  const post = await getPost(db, id);
  if (!post)
    throw new ToolError("No post with that id. Use blog_list to see them.");
  return post;
}

/** The link's addresses in both languages, and when it was made. */
function addresses(share: ShareLink) {
  return {
    url: siteUrl("blog", `/drafts/${share.token}`),
    urlFr: siteUrl("blog", `/fr/drafts/${share.token}`),
    createdAt: share.createdAt,
  };
}

const share = defineTool({
  name: "blog_post_share",
  title: "Share a draft by private link",
  description:
    "Turns sharing on for a draft and answers its private link (English and French addresses): anyone holding it can read the draft and send feedback; it is never listed or indexed. Answers the existing link if sharing is already on; `renew: true` makes a new one and the old one stops working. Only a draft can be shared.",
  scope: "publish",
  write: true,
  alsoNeeds: ["write"],
  input: {
    id: postId,
    renew: z
      .boolean()
      .optional()
      .describe("Make a new link; the current one stops working"),
  },
  async run({ id, renew }, { db }) {
    const post = await draftOrFail(db, id);
    const result = await sharePost(db, id, { renew: renew === true });
    if (!result.ok) refuse(result, "post");
    return {
      summary: `${renew ? "Renewed the link of" : "Shared"} draft ${post.slug}`,
      data: { id, slug: post.slug, ...addresses(result.share) },
    };
  },
});

const unshare = defineTool({
  name: "blog_post_unshare",
  title: "Stop sharing a draft",
  description:
    "Turns a post's share link off: it stops working at once. Feedback already sent is kept.",
  scope: "publish",
  write: true,
  alsoNeeds: ["write"],
  input: { id: postId },
  async run({ id }, { db }) {
    const post = await draftOrFail(db, id);
    const result = await unsharePost(db, id);
    if (!result.ok) refuse(result, "post");
    return {
      summary: `Stopped sharing ${post.slug}`,
      data: { id, slug: post.slug, shared: false },
    };
  },
});

const feedbackList = defineTool({
  name: "blog_draft_feedback_list",
  title: "Read a draft's feedback",
  description:
    "The private feedback sent on a shared draft, newest first: id, name, text, language, when it was sent, and when it was marked read (null = unread).",
  scope: "read",
  write: false,
  input: { id: postId },
  async run({ id }, { db }) {
    const post = await draftOrFail(db, id);
    const items = await listFeedback(db, id);
    const unread = items.filter((item) => !item.readAt).length;
    return {
      summary: `Listed ${items.length} feedback on ${post.slug}`,
      data: { id, slug: post.slug, unread, items },
    };
  },
});

const feedbackMarkRead = defineTool({
  name: "blog_draft_feedback_mark_read",
  title: "Mark a draft's feedback read",
  description:
    "Marks the feedback items you name in `ids` read, or with `all: true` every unread item of the post.",
  scope: "write",
  write: true,
  input: {
    id: postId,
    ids: z
      .array(z.number().int().positive())
      .max(500)
      .optional()
      .describe("The feedback ids to mark read"),
    all: z.boolean().optional().describe("Mark every unread item read"),
  },
  async run({ id, ids, all }, { db }) {
    const post = await draftOrFail(db, id);
    if (all !== true && !ids?.length)
      throw new ToolError(
        "Send `ids` (the feedback to mark read) or `all: true`.",
      );
    const marked = await markFeedbackRead(db, id, all === true ? "all" : ids!);
    return {
      summary: `Marked ${marked} feedback read on ${post.slug}`,
      data: { id, marked },
    };
  },
});

const feedbackDelete = defineTool({
  name: "blog_draft_feedback_delete",
  title: "Delete one item of a draft's feedback",
  description:
    "Permanently deletes one feedback item. Send the sender's exact name (as listed) in `confirm`.",
  scope: "delete",
  write: true,
  hints: { destructive: true },
  input: {
    id: postId,
    feedbackId: z
      .number()
      .int()
      .positive()
      .describe("The feedback's id (blog_draft_feedback_list)"),
    confirm: z.string().describe("The sender's exact name"),
  },
  async run({ id, feedbackId, confirm }, { db }) {
    await draftOrFail(db, id);
    const item = (await listFeedback(db, id)).find(
      (entry) => entry.id === feedbackId,
    );
    if (!item)
      throw new ToolError(
        "No feedback with that id on this post. Use blog_draft_feedback_list to see it.",
      );
    requireConfirm(confirm, item.name, "feedback");
    await deleteFeedback(db, id, feedbackId);
    return {
      summary: `Deleted feedback from ${item.name}`,
      data: { deleted: item.name },
    };
  },
});

export const draftTools: AnyTool[] = [
  share,
  unshare,
  feedbackList,
  feedbackMarkRead,
  feedbackDelete,
];
