"use client";

import { Check, Flag, Heart, Reply, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/shared/Button";
import { Tag } from "@/components/shared/Tag";
import { pieces } from "@/lib/blog/commentText";
import type { CommentView } from "@/lib/blog/comments";
import { fullDate, relativeTime } from "@/lib/blog/relativeTime";
import { cn } from "@/lib/cn";
import { RollingCount } from "../RollingCount";
import { Avatar } from "./Avatar";
import { Composer } from "./Composer";
import { Dialog } from "./Dialog";

// The text of a comment: line breaks kept, web addresses linked with
// rel="nofollow ugc noopener", and everything else as plain text nodes: nothing
// is ever rendered as HTML.
function Text({ body }: { body: string }) {
  return (
    <p className="mt-1 text-body break-words whitespace-pre-wrap text-foreground">
      {pieces(body).map((piece, index) =>
        piece.type === "link" ? (
          <a
            key={index}
            href={piece.href}
            target="_blank"
            rel="nofollow ugc noopener noreferrer"
            className="link-inline"
          >
            {piece.text}
          </a>
        ) : (
          piece.text
        ),
      )}
    </p>
  );
}

type Action = "like" | "reply" | "report" | "delete";

// One comment (design.md §13.37): who, when, what, and Like, Reply, Report (to
// someone else's) and Delete (your own). A signed-out reader who tries Like or
// Reply is asked to sign in (`onNeedSignIn`).
export function CommentItem({
  comment,
  slug,
  signedIn,
  reader,
  maxWords,
  isReply = false,
  onNeedSignIn,
  onPosted,
  onChanged,
  onDeleted,
}: {
  comment: CommentView;
  slug: string;
  signedIn: boolean;
  reader: { name: string; image: string | null } | null;
  maxWords: number;
  isReply?: boolean;
  onNeedSignIn: () => void;
  onPosted: (parentId: number, comment: CommentView) => void;
  onChanged: (id: number, change: Partial<CommentView>) => void;
  onDeleted: (id: number) => void;
}) {
  const [replying, setReplying] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [confirm, setConfirm] = useState<"report" | "delete" | null>(null);
  const [busy, setBusy] = useState<Action | null>(null);
  const [reported, setReported] = useState(false);
  const [note, setNote] = useState("");
  const [up, setUp] = useState(true);

  const call = async (path: string, method = "POST") => {
    const response = await fetch(`/api/blog/comments/${comment.id}${path}`, {
      method,
    });
    return response;
  };

  const like = async () => {
    if (!signedIn) return onNeedSignIn();
    if (busy) return;
    setBusy("like");
    const before = comment;
    setUp(!comment.liked);
    onChanged(comment.id, {
      liked: !comment.liked,
      likeCount: Math.max(0, comment.likeCount + (comment.liked ? -1 : 1)),
    });
    try {
      const response = await call("/like");
      if (response.ok) {
        const data = (await response.json()) as {
          count: number;
          liked: boolean;
        };
        onChanged(comment.id, { likeCount: data.count, liked: data.liked });
      } else
        onChanged(comment.id, {
          liked: before.liked,
          likeCount: before.likeCount,
        });
    } catch {
      onChanged(comment.id, {
        liked: before.liked,
        likeCount: before.likeCount,
      });
    }
    setBusy(null);
  };

  const report = async () => {
    setConfirm(null);
    setBusy("report");
    try {
      const response = await call("/report");
      if (response.ok) {
        setReported(true);
        setNote("Reported. Thank you.");
      } else setNote("Couldn't send that. Please try again.");
    } catch {
      setNote("Couldn't send that. Please try again.");
    }
    setBusy(null);
  };

  const remove = async () => {
    setConfirm(null);
    setBusy("delete");
    try {
      const response = await call("", "DELETE");
      if (response.ok) {
        if (comment.replies.length > 0)
          onChanged(comment.id, {
            removed: true,
            body: "",
            author: null,
            likeCount: 0,
          });
        else onDeleted(comment.id);
        return;
      }
      setNote("Couldn't delete that. Please try again.");
    } catch {
      setNote("Couldn't delete that. Please try again.");
    }
    setBusy(null);
  };

  const action =
    "flex h-8 items-center gap-1.5 rounded-sm px-1.5 text-sm text-muted transition-colors duration-150 outline-none hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-60";

  if (comment.removed) {
    return (
      <li className={cn(isReply && "ml-6 sm:ml-10")}>
        <p className="text-sm text-muted">This comment was removed.</p>
        <Replies
          {...{
            comment,
            slug,
            signedIn,
            reader,
            maxWords,
            showAll,
            setShowAll,
            onNeedSignIn,
            onPosted,
            onChanged,
            onDeleted,
          }}
        />
      </li>
    );
  }

  const author = comment.author!;

  return (
    <li className={cn(isReply && "ml-6 sm:ml-10")}>
      <article
        aria-label={`Comment by ${author.name}`}
        className="animate-[comment-in_300ms_ease-out] motion-reduce:animate-none"
      >
        <div className="flex items-start gap-3">
          <Avatar name={author.name} image={author.image} />
          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
              <span className="font-semibold text-foreground">
                {author.name}
              </span>
              {author.isAuthor && <Tag>AUTHOR</Tag>}
              <time
                dateTime={comment.createdAt}
                title={fullDate(comment.createdAt)}
                className="text-muted"
              >
                {relativeTime(comment.createdAt)}
              </time>
            </p>
            <Text body={comment.body} />
            <div className="mt-1 -ml-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
              <button
                type="button"
                aria-pressed={comment.liked}
                aria-label={`Like this comment, ${comment.likeCount} ${comment.likeCount === 1 ? "like" : "likes"}`}
                onClick={() => void like()}
                className={action}
              >
                <Heart
                  className={cn(
                    "size-4",
                    comment.liked && "fill-primary-text text-primary-text",
                  )}
                  aria-hidden="true"
                />
                <RollingCount value={comment.likeCount} up={up} />
              </button>
              {!isReply && (
                <button
                  type="button"
                  aria-expanded={replying}
                  onClick={() =>
                    signedIn ? setReplying((value) => !value) : onNeedSignIn()
                  }
                  className={action}
                >
                  <Reply className="size-4" aria-hidden="true" />
                  Reply
                </button>
              )}
              {signedIn && !comment.mine && (
                <button
                  type="button"
                  disabled={reported || busy === "report"}
                  onClick={() => setConfirm("report")}
                  className={action}
                >
                  {reported ? (
                    <Check className="size-4" aria-hidden="true" />
                  ) : (
                    <Flag className="size-4" aria-hidden="true" />
                  )}
                  {reported ? "Reported" : "Report"}
                </button>
              )}
              {comment.mine && (
                <button
                  type="button"
                  disabled={busy === "delete"}
                  onClick={() => setConfirm("delete")}
                  className={action}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                  Delete
                </button>
              )}
            </div>
            {note && (
              <p role="status" className="mt-1 text-sm text-muted">
                {note}
              </p>
            )}
            {replying && reader && (
              <div className="mt-4">
                <Composer
                  slug={slug}
                  parentId={comment.id}
                  reader={reader}
                  maxWords={maxWords}
                  label="Add a reply"
                  autoFocus
                  onCancel={() => setReplying(false)}
                  onPosted={(created) => {
                    setReplying(false);
                    setShowAll(true);
                    onPosted(comment.id, created);
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </article>
      {!isReply && comment.replies.length > 0 && (
        <div className="mt-4">
          <Replies
            {...{
              comment,
              slug,
              signedIn,
              reader,
              maxWords,
              showAll,
              setShowAll,
              onNeedSignIn,
              onPosted,
              onChanged,
              onDeleted,
            }}
          />
        </div>
      )}
      {confirm === "report" && (
        <Dialog title="Report this comment?" onClose={() => setConfirm(null)}>
          <p className="text-body text-muted">
            The owner is told and will take a look. Each reader can report a
            comment once.
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <Button
              variant="secondary"
              magnetic={false}
              autoFocus
              onClick={() => setConfirm(null)}
            >
              Cancel
            </Button>
            <Button magnetic={false} onClick={() => void report()}>
              Report
            </Button>
          </div>
        </Dialog>
      )}
      {confirm === "delete" && (
        <Dialog title="Delete your comment?" onClose={() => setConfirm(null)}>
          <p className="text-body text-muted">
            {comment.replies.length > 0
              ? "It will read “This comment was removed.” so the replies keep their place."
              : "It is removed for good."}
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <Button
              variant="secondary"
              magnetic={false}
              autoFocus
              onClick={() => setConfirm(null)}
            >
              Cancel
            </Button>
            <Button magnetic={false} onClick={() => void remove()}>
              Delete
            </Button>
          </div>
        </Dialog>
      )}
    </li>
  );
}

// The replies under a comment, one level deep; more than two are folded behind
// "Show N replies".
function Replies({
  comment,
  slug,
  signedIn,
  reader,
  maxWords,
  showAll,
  setShowAll,
  onNeedSignIn,
  onPosted,
  onChanged,
  onDeleted,
}: {
  comment: CommentView;
  slug: string;
  signedIn: boolean;
  reader: { name: string; image: string | null } | null;
  maxWords: number;
  showAll: boolean;
  setShowAll: (value: boolean) => void;
  onNeedSignIn: () => void;
  onPosted: (parentId: number, comment: CommentView) => void;
  onChanged: (id: number, change: Partial<CommentView>) => void;
  onDeleted: (id: number) => void;
}) {
  const replies = comment.replies;
  if (replies.length === 0) return null;
  if (replies.length > 2 && !showAll) {
    return (
      <div className="ml-6 sm:ml-10">
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="link-inline text-sm text-muted hover:text-foreground"
        >
          Show {replies.length} replies
        </button>
      </div>
    );
  }
  return (
    <ul
      aria-label={`Replies to ${comment.author?.name ?? "a removed comment"}`}
      className="flex flex-col gap-5"
    >
      {replies.map((reply) => (
        <CommentItem
          key={reply.id}
          comment={reply}
          slug={slug}
          signedIn={signedIn}
          reader={reader}
          maxWords={maxWords}
          isReply
          onNeedSignIn={onNeedSignIn}
          onPosted={onPosted}
          onChanged={onChanged}
          onDeleted={onDeleted}
        />
      ))}
    </ul>
  );
}
