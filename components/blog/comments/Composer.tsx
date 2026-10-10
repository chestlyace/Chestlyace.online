"use client";

import { CircleAlert } from "lucide-react";
import { useId, useRef, useState } from "react";
import { Button } from "@/components/shared/Button";
import { fieldControl } from "@/components/shared/FormField";
import { countWords } from "@/lib/blog/commentText";
import { cn } from "@/lib/cn";
import { format } from "@/lib/i18n/format";
import { Avatar } from "./Avatar";
import { useCommentsText } from "./CommentsText";
import { failureText, type Failure } from "./failureText";
import type { CommentView } from "@/lib/blog/comments";

// The composer (design.md §13.37): the reader's avatar beside a textarea, a word
// counter that turns red over the limit, and "Post comment". Plain text only.
export function Composer({
  slug,
  parentId = null,
  reader,
  maxWords,
  label,
  autoFocus = false,
  onPosted,
  onCancel,
}: {
  slug: string;
  parentId?: number | null;
  reader: { name: string; image: string | null };
  maxWords: number;
  label?: string;
  autoFocus?: boolean;
  onPosted: (comment: CommentView) => void;
  onCancel?: () => void;
}) {
  const id = useId();
  const { text: t } = useCommentsText();
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const area = useRef<HTMLTextAreaElement>(null);
  const words = countWords(text);
  const over = words > maxWords;

  const post = async () => {
    if (posting || !text.trim() || over) return;
    setPosting(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/blog/posts/${encodeURIComponent(slug)}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body: text, parentId }),
        },
      );
      const data = (await response.json().catch(() => ({}))) as {
        comment?: CommentView;
      } & Failure;
      if (response.ok && data.comment) {
        setText("");
        onPosted(data.comment);
        area.current?.focus();
      } else setError(failureText(t, data, response.status));
    } catch {
      setError(t.offline);
    }
    setPosting(false);
  };

  return (
    <div className="flex items-start gap-3">
      <Avatar name={reader.name} image={reader.image} size={36} />
      <div className="min-w-0 flex-1">
        <label
          htmlFor={id}
          className="mb-2 block text-sm font-medium text-foreground"
        >
          {label ?? t.addComment}
        </label>
        <textarea
          id={id}
          ref={area}
          value={text}
          rows={3}
          autoFocus={autoFocus}
          readOnly={posting}
          aria-busy={posting}
          aria-describedby={`${id}-count${error ? ` ${id}-error` : ""}`}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
              event.preventDefault();
              void post();
            }
          }}
          className={cn(
            fieldControl,
            "min-h-24 max-h-60 resize-y px-4 py-3",
            posting && "opacity-60",
          )}
        />
        {error && (
          <p
            id={`${id}-error`}
            role="alert"
            className="mt-2 flex items-start gap-1.5 text-sm text-danger"
          >
            <CircleAlert
              className="mt-0.5 size-3.5 shrink-0"
              aria-hidden="true"
            />
            {error}
          </p>
        )}
        <div className="mt-3 flex items-center justify-between gap-3">
          <p
            id={`${id}-count`}
            className={cn("text-sm", over ? "text-danger" : "text-muted")}
          >
            {format(t.words, { count: words, max: maxWords })}
          </p>
          <div className="flex items-center gap-2">
            {onCancel && (
              <Button
                variant="ghost"
                size="sm"
                magnetic={false}
                onClick={onCancel}
              >
                {t.cancel}
              </Button>
            )}
            <Button
              size="sm"
              magnetic={false}
              loading={posting}
              disabled={!text.trim() || over}
              onClick={() => void post()}
            >
              {t.post}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
