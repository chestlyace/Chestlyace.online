"use client";

import { Button } from "@/components/shared/Button";
import { FormField, fieldControl } from "@/components/shared/FormField";
import type { FrenchPost, PostDetails } from "@/lib/admin/blogForm";
import { cn } from "@/lib/cn";
import { AdminField } from "../fields";

type Errors = Record<string, string | undefined>;

// The French version of a post (docs/i18n.md §5): its title, description, cover
// description and series, the text as markdown, and the switch that puts it live. The
// English fields are shown as hints; a blank French field falls back to the English
// one on the blog. The body uses the same block syntax as the English text, so
// "Start from the English text" is the way to begin (code, steps and quizzes keep their
// structure; only the words need translating).
export function FrenchPanel({
  french,
  english,
  englishContent,
  errors,
  postStatus,
  onChange,
}: {
  french: FrenchPost;
  english: PostDetails;
  englishContent: string;
  errors: Errors;
  postStatus: "draft" | "published";
  onChange: <K extends keyof FrenchPost>(name: K, value: FrenchPost[K]) => void;
}) {
  const text = (
    name: "title" | "description" | "coverAlt" | "series",
    label: string,
    max: number,
    long = false,
  ) => (
    <FormField
      id={`post-fr-${name}`}
      label={label}
      optional
      helper={
        english[name]
          ? `English: ${english[name]}`
          : "Blank uses the English text."
      }
      error={errors[`fr:${name}`]}
    >
      {long ? (
        <textarea
          id={`post-fr-${name}`}
          name={`fr:${name}`}
          lang="fr"
          rows={3}
          maxLength={max}
          value={french[name]}
          onChange={(event) => onChange(name, event.target.value)}
          className={cn(fieldControl, "min-h-24 resize-y px-4 py-3")}
        />
      ) : (
        <input
          id={`post-fr-${name}`}
          name={`fr:${name}`}
          lang="fr"
          maxLength={max}
          value={french[name]}
          autoComplete="off"
          onChange={(event) => onChange(name, event.target.value)}
          className={cn(fieldControl, "h-12 px-4")}
        />
      )}
    </FormField>
  );

  return (
    <section
      id="post-french"
      aria-label="French version"
      className="grid max-w-[45rem] gap-6"
    >
      <AdminField
        field={{
          type: "switch",
          name: "fr:published",
          label: "Publish the French version",
          helper:
            "On the French blog the post reads in French. Off, or without French text, it stays in English there, marked EN. Needs the French text below" +
            (postStatus === "published"
              ? "."
              : ", and shows once the post itself is published."),
        }}
        value={french.published}
        error={errors["fr:published"]}
        onChange={(value) => onChange("published", Boolean(value))}
        onBlur={() => {}}
      />
      {text("title", "Title (French)", 200)}
      {text("description", "Description (French)", 300, true)}
      {text("coverAlt", "Cover description (French)", 200)}
      {text("series", "Series (French)", 80)}

      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
          <label
            htmlFor="post-fr-content"
            className="text-sm font-medium text-foreground"
          >
            Text (French, markdown)
          </label>
          <Button
            variant="ghost"
            size="sm"
            magnetic={false}
            disabled={french.content.trim() !== "" || !englishContent.trim()}
            title={
              french.content.trim() !== ""
                ? "The French text is not empty"
                : undefined
            }
            onClick={() => onChange("content", englishContent)}
          >
            Start from the English text
          </Button>
        </div>
        <textarea
          id="post-fr-content"
          name="fr:content"
          lang="fr"
          value={french.content}
          spellCheck
          rows={24}
          aria-invalid={errors["fr:content"] ? true : undefined}
          aria-describedby={
            errors["fr:content"] ? "post-fr-content-error" : undefined
          }
          onChange={(event) => onChange("content", event.target.value)}
          className="block min-h-96 w-full resize-y rounded-md bg-tile px-4 py-3 font-mono text-[0.9375rem] leading-[1.6] whitespace-pre text-foreground shadow-[inset_0_0_0_1px_var(--border)] outline-none focus-visible:outline-2 focus-visible:outline-ring"
        />
        {errors["fr:content"] && (
          <p
            id="post-fr-content-error"
            role="alert"
            className="mt-2 text-sm text-danger"
          >
            {errors["fr:content"]}
          </p>
        )}
      </div>
    </section>
  );
}
