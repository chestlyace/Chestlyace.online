"use client";

import { CircleAlert } from "lucide-react";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/shared/Button";
import { FormField, fieldControl } from "@/components/shared/FormField";
import type { Messages } from "@/content/messages";
import { countWords } from "@/lib/blog/commentText";
import {
  FEEDBACK_NAME_MAX,
  feedbackErrors,
  type FeedbackFieldError,
} from "@/lib/blog/feedbackText";
import { cn } from "@/lib/cn";
import { MIN_FORM_SECONDS } from "@/lib/contact";
import { format } from "@/lib/i18n/format";
import type { Lang } from "@/lib/i18n";

type Text = Messages["blog"]["draft"]["feedback"];
type Field = "name" | "body";

// Private feedback under a shared draft (design.md §13.69, D93): a name and the text,
// no account. The contact form's protection: a hidden field people never reach and a
// few seconds on the form (a quick send just waits them out).
export function DraftFeedback({
  token,
  lang,
  maxWords,
  text,
}: {
  token: string;
  lang: Lang;
  maxWords: number;
  text: Text;
}) {
  const ids = useId();
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [errors, setErrors] = useState<
    Partial<Record<Field, FeedbackFieldError>>
  >({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [failure, setFailure] = useState<{
    text: string;
    retry: boolean;
  } | null>(null);
  const shownAt = useRef(0);
  const honeypot = useRef<HTMLInputElement>(null);
  const sentPanel = useRef<HTMLDivElement>(null);
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    shownAt.current = Date.now();
  }, []);
  useEffect(() => {
    if (status === "sent") sentPanel.current?.focus();
  }, [status]);

  const words = countWords(body);
  const message = (code?: FeedbackFieldError) =>
    code ? format(text.errors[code], { max: maxWords }) : null;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (status === "sending") return;
    const found = feedbackErrors({ name, body }, maxWords);
    setErrors(found);
    const first = (Object.keys(found) as Field[])[0];
    if (first) {
      form.current
        ?.querySelector<HTMLElement>(`[name="${first}"]`)
        ?.focus();
      return;
    }

    setStatus("sending");
    setFailure(null);
    const wait = MIN_FORM_SECONDS * 1000 - (Date.now() - shownAt.current);
    if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));

    try {
      const response = await fetch(
        `/api/blog/drafts/${encodeURIComponent(token)}/feedback`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            body,
            lang,
            website: honeypot.current?.value ?? "",
            elapsedMs: Date.now() - shownAt.current,
          }),
        },
      );
      if (response.ok) {
        setStatus("sent");
        return;
      }
      const result = (await response.json().catch(() => ({}))) as {
        fields?: Partial<Record<Field, FeedbackFieldError>>;
      };
      if (response.status === 422 && result.fields) setErrors(result.fields);
      else
        setFailure(
          response.status === 429
            ? { text: text.failures.rateLimited, retry: false }
            : response.status === 404
              ? { text: text.failures.notShared, retry: false }
              : response.status === 409
                ? { text: text.failures.duplicate, retry: false }
                : { text: text.failures.failed, retry: true },
        );
    } catch {
      setFailure({ text: text.failures.failed, retry: true });
    }
    setStatus("idle");
  };

  const describe = (field: Field, extra?: string) =>
    [errors[field] ? `${ids}-${field}-error` : null, extra]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <section id="feedback" aria-labelledby={`${ids}-title`} className="scroll-mt-28">
      <h2 id={`${ids}-title`} className="text-h3 text-foreground">
        {text.title}
      </h2>
      <p className="mt-2 text-sm text-muted">{text.intro}</p>

      {status === "sent" ? (
        <div
          ref={sentPanel}
          tabIndex={-1}
          role="status"
          className="mt-6 animate-[comment-in_200ms_ease-out] rounded-lg bg-surface p-6 outline-none motion-reduce:animate-none"
        >
          <p className="text-body text-foreground">{text.sent}</p>
          <Button
            variant="ghost"
            size="sm"
            magnetic={false}
            className="mt-4"
            onClick={() => {
              setBody("");
              setErrors({});
              shownAt.current = Date.now();
              setStatus("idle");
            }}
          >
            {text.sendMore}
          </Button>
        </div>
      ) : (
        <form
          ref={form}
          noValidate
          onSubmit={submit}
          className="relative mt-6 grid gap-6"
        >
          <FormField
            id={`${ids}-name`}
            label={text.name}
            error={message(errors.name)}
          >
            <input
              id={`${ids}-name`}
              name="name"
              type="text"
              autoComplete="name"
              maxLength={FEEDBACK_NAME_MAX + 20}
              value={name}
              disabled={status === "sending"}
              onChange={(event) => {
                setName(event.target.value);
                setErrors((now) => ({ ...now, name: undefined }));
              }}
              aria-invalid={errors.name ? true : undefined}
              aria-describedby={describe("name")}
              className={cn(fieldControl, "h-12 px-4")}
            />
          </FormField>

          <FormField
            id={`${ids}-body`}
            label={text.body}
            error={message(errors.body)}
          >
            <textarea
              id={`${ids}-body`}
              name="body"
              value={body}
              disabled={status === "sending"}
              onChange={(event) => {
                setBody(event.target.value);
                setErrors((now) => ({ ...now, body: undefined }));
              }}
              aria-invalid={errors.body ? true : undefined}
              aria-describedby={describe("body", `${ids}-words`)}
              className={cn(
                fieldControl,
                "min-h-30 max-h-80 resize-y px-4 py-3",
              )}
            />
            <p
              id={`${ids}-words`}
              className={cn(
                "mt-1.5 text-sm",
                words > maxWords ? "text-danger" : "text-muted",
              )}
            >
              {format(text.words, { count: words, max: maxWords })}
            </p>
          </FormField>

          {/* A trap for bots: people never see or reach this field. */}
          <div
            aria-hidden="true"
            className="absolute -left-[9999px] h-0 w-0 overflow-hidden"
          >
            <label>
              {text.website}
              <input
                ref={honeypot}
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                defaultValue=""
              />
            </label>
          </div>

          {failure && (
            <p
              role="alert"
              className="flex items-start gap-2 text-sm text-danger"
            >
              <CircleAlert
                className="mt-0.5 size-4 shrink-0"
                aria-hidden="true"
              />
              <span>
                {failure.text}
                {failure.retry && (
                  <>
                    {" "}
                    <button
                      type="submit"
                      className="font-medium underline underline-offset-2"
                    >
                      {text.failures.retry}
                    </button>
                  </>
                )}
              </span>
            </p>
          )}

          <div>
            <Button type="submit" loading={status === "sending"}>
              {status === "sending" ? text.sending : text.send}
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}
