"use client";

import { CircleAlert, CircleCheck } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/shared/Button";
import { FormField, fieldControl } from "@/components/shared/FormField";
import { Reveal } from "@/components/shared/Reveal";
import { cn } from "@/lib/cn";
import { cleanEmail } from "@/lib/newsletter";
import type { NewsletterCopy } from "@/lib/newsletterCopy";

type Status = "idle" | "sending" | "sent" | "failed";

// The newsletter box (design.md §13.34), with the wording the owner set in the
// admin: a panel with an email field and a
// Subscribe button. The address is only emailed a confirmation link here (double
// opt-in); the answer is the same whether or not it is already subscribed. A
// hidden field and a per-IP limit keep bots out (no CAPTCHA). The success message
// takes focus and is announced.
export function NewsletterBox({
  copy,
  className,
}: {
  copy: NewsletterCopy["box"];
  className?: string;
}) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [failure, setFailure] = useState(copy.error);
  const honeypot = useRef<HTMLInputElement>(null);
  const input = useRef<HTMLInputElement>(null);
  // The success message takes focus when it appears (after the form fades out).
  const focusOnMount = useCallback((element: HTMLElement | null) => {
    element?.focus();
  }, []);

  const check = (value: string) =>
    setError(cleanEmail(value) ? null : copy.invalid);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === "sending") return;
    if (!cleanEmail(email)) {
      setError(copy.invalid);
      input.current?.focus();
      return;
    }
    setError(null);
    setStatus("sending");
    setFailure(copy.error);
    try {
      const response = await fetch("/api/blog/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          website: honeypot.current?.value ?? "",
        }),
      });
      if (response.ok) {
        setStatus("sent");
        return;
      }
      if (response.status === 422) {
        setError(copy.invalid);
        setStatus("idle");
        input.current?.focus();
        return;
      }
      if (response.status === 429) setFailure(copy.rateLimited);
    } catch {
      // a network error: the generic message below
    }
    setStatus("failed");
  };

  return (
    <Reveal className={className}>
      <section
        aria-label="Newsletter"
        className="rounded-xl bg-surface p-6 sm:p-8"
      >
        <div className="max-w-[36rem]">
          <p className="type-label text-muted">{copy.label}</p>
          <h2 className="mt-2 text-title text-foreground">{copy.title}</h2>
          <p className="mt-3 text-body text-muted">{copy.text}</p>

          <div className="mt-6">
            <AnimatePresence mode="wait" initial={false}>
              {status === "sent" ? (
                <motion.div
                  key="sent"
                  ref={focusOnMount}
                  role="status"
                  tabIndex={-1}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-start gap-3 rounded-md outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                >
                  <CircleCheck
                    className="mt-0.5 size-6 shrink-0 text-secondary"
                    aria-hidden="true"
                  />
                  <p className="text-body text-foreground">{copy.success}</p>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  noValidate
                  onSubmit={submit}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col gap-3"
                >
                  {status === "failed" && (
                    <p
                      role="alert"
                      className="flex items-start gap-2 text-sm text-danger"
                    >
                      <CircleAlert
                        className="mt-0.5 size-4 shrink-0"
                        aria-hidden="true"
                      />
                      {failure}
                    </p>
                  )}
                  <FormField id="newsletter-email" label="Email" error={error}>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <input
                        ref={input}
                        id="newsletter-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        inputMode="email"
                        value={email}
                        disabled={status === "sending"}
                        onChange={(event) => {
                          setEmail(event.target.value);
                          if (error) check(event.target.value);
                        }}
                        onBlur={() => email && check(email)}
                        aria-invalid={error ? true : undefined}
                        aria-describedby={cn(
                          error && "newsletter-email-error",
                          "newsletter-helper",
                        )}
                        className={cn(fieldControl, "h-12 min-w-0 flex-1 px-4")}
                      />
                      <Button
                        type="submit"
                        loading={status === "sending"}
                        className="w-full sm:w-auto"
                      >
                        Subscribe
                      </Button>
                    </div>
                  </FormField>

                  {/* A trap for bots: people never see or reach this field. */}
                  <div
                    aria-hidden="true"
                    className="absolute -left-[9999px] h-0 w-0 overflow-hidden"
                  >
                    <label>
                      Website
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

                  <p id="newsletter-helper" className="text-sm text-muted">
                    {copy.helper}
                  </p>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>
    </Reveal>
  );
}
