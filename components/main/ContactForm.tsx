"use client";

import { ChevronDown, CircleAlert, CircleCheck } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/shared/Button";
import { FormField, fieldControl } from "@/components/shared/FormField";
import { Reveal } from "@/components/shared/Reveal";
import type { Messages } from "@/content/messages";
import { cn } from "@/lib/cn";
import {
  CONTACT_FIELDS,
  MIN_FORM_SECONDS,
  SUBJECTS,
  fieldError,
  whatsappHref,
  whatsappText,
  type ContactErrors,
  type ContactField,
  type ContactValues,
} from "@/lib/contact";

type FormMessages = Messages["home"]["contact"]["form"];

type Status = "idle" | "sending" | "sent" | "failed";

const EMPTY: ContactValues = { name: "", email: "", subject: "", message: "" };
const TEXTAREA_MAX = 320;

// The contact form (design.md §13.15, §14.8). A field is checked when the
// visitor leaves it, then re-checked as they type once it has shown an error.
// On submit every field is checked and focus goes to the first invalid one. The
// message is emailed through /api/contact; on success a thank-you panel offers
// to continue on WhatsApp (Q10).
export function ContactForm({
  whatsappNumber,
  form,
}: {
  whatsappNumber: string | null;
  /** The form's words, in the page's language. */
  form: FormMessages;
}) {
  const [values, setValues] = useState<ContactValues>(EMPTY);
  const [errors, setErrors] = useState<ContactErrors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [failure, setFailure] = useState<string>(form.failures.failed);
  const [sentValues, setSentValues] = useState<ContactValues | null>(null);
  const shownAt = useRef(0);
  const formRef = useRef<HTMLFormElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const honeypotRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    shownAt.current = Date.now();
  }, []);

  const check = (field: ContactField, value: string) =>
    setErrors((current) => ({
      ...current,
      [field]: fieldError(field, value, form.errors) ?? undefined,
    }));

  const change =
    (field: ContactField) => (event: { target: { value: string } }) => {
      const value = event.target.value;
      setValues((current) => ({ ...current, [field]: value }));
      if (errors[field]) check(field, value);
    };

  const blur = (field: ContactField) => () => check(field, values[field]);

  // The textarea grows with its text, up to 320px, then scrolls.
  useEffect(() => {
    const area = messageRef.current;
    if (!area) return;
    area.style.height = "auto";
    area.style.height = `${Math.min(area.scrollHeight, TEXTAREA_MAX)}px`;
  }, [values.message]);

  const describe = (field: ContactField) =>
    errors[field] ? `contact-${field}-error` : undefined;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === "sending") return;

    const next: ContactErrors = {};
    for (const field of CONTACT_FIELDS) {
      const error = fieldError(field, values[field], form.errors);
      if (error) next[field] = error;
    }
    setErrors(next);
    const firstInvalid = CONTACT_FIELDS.find((field) => next[field]);
    if (firstInvalid) {
      formRef.current
        ?.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)
        ?.focus();
      return;
    }

    setStatus("sending");
    setFailure(form.failures.failed);
    // A person can't have filled the form in under a few seconds, so a quick
    // submit simply waits out the rest; the server checks the same clock.
    const wait = MIN_FORM_SECONDS * 1000 - (Date.now() - shownAt.current);
    if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          website: honeypotRef.current?.value ?? "",
          elapsedMs: Date.now() - shownAt.current,
        }),
      });
      if (response.ok) {
        setSentValues({ ...values });
        setStatus("sent");
        return;
      }
      if (response.status === 429) setFailure(form.failures.rateLimited);
      if (response.status === 422) {
        const body = (await response.json().catch(() => null)) as {
          fields?: ContactErrors;
        } | null;
        // The server's messages are English; the same checks run here in the
        // page's language.
        const fresh: ContactErrors = {};
        for (const field of CONTACT_FIELDS) {
          const error = fieldError(field, values[field], form.errors);
          if (error) fresh[field] = error;
        }
        setErrors(Object.keys(fresh).length > 0 ? fresh : (body?.fields ?? {}));
      }
    } catch {
      // network error: the generic message below
    }
    setStatus("failed");
  };

  const whatsapp =
    sentValues && whatsappNumber
      ? whatsappHref(
          whatsappNumber,
          whatsappText(
            {
              ...sentValues,
              subject:
                form.subjects[
                  sentValues.subject as keyof typeof form.subjects
                ] ?? sentValues.subject,
            },
            form.whatsappMessage,
          ),
        )
      : null;

  return (
    <Reveal stagger={0.06}>
      <AnimatePresence mode="wait" initial={false}>
        {status === "sent" ? (
          <motion.div
            key="sent"
            role="status"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-start gap-4 py-4"
          >
            <CircleCheck className="size-8 text-secondary" aria-hidden="true" />
            <h3 className="text-h3 text-foreground">{form.success.title}</h3>
            <p className="max-w-[44ch] text-body text-muted">
              {form.success.text}
            </p>
            {whatsapp && (
              <Button href={whatsapp} external variant="secondary">
                {form.success.whatsapp}
              </Button>
            )}
          </motion.div>
        ) : (
          <motion.form
            key="form"
            ref={formRef}
            aria-label={form.label}
            noValidate
            onSubmit={submit}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col gap-5"
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

            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                data-reveal
                id="contact-name"
                label={form.name}
                error={errors.name}
              >
                <input
                  id="contact-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  value={values.name}
                  onChange={change("name")}
                  onBlur={blur("name")}
                  aria-invalid={errors.name ? true : undefined}
                  aria-describedby={describe("name")}
                  className={cn(fieldControl, "h-12 px-4")}
                />
              </FormField>
              <FormField
                data-reveal
                id="contact-email"
                label={form.email}
                error={errors.email}
              >
                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  value={values.email}
                  onChange={change("email")}
                  onBlur={blur("email")}
                  aria-invalid={errors.email ? true : undefined}
                  aria-describedby={describe("email")}
                  className={cn(fieldControl, "h-12 px-4")}
                />
              </FormField>
            </div>

            <FormField
              data-reveal
              id="contact-subject"
              label={form.subject}
              error={errors.subject}
            >
              <div className="relative">
                <select
                  id="contact-subject"
                  name="subject"
                  value={values.subject}
                  onChange={change("subject")}
                  onBlur={blur("subject")}
                  aria-invalid={errors.subject ? true : undefined}
                  aria-describedby={describe("subject")}
                  className={cn(
                    fieldControl,
                    "h-12 appearance-none pr-10 pl-4",
                    !values.subject && "text-muted",
                  )}
                >
                  <option value="" disabled>
                    {form.subjectPlaceholder}
                  </option>
                  {SUBJECTS.map((subject) => (
                    <option
                      key={subject}
                      value={subject}
                      className="text-foreground"
                    >
                      {form.subjects[subject]}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-muted"
                  aria-hidden="true"
                />
              </div>
            </FormField>

            <FormField
              data-reveal
              id="contact-message"
              label={form.message}
              error={errors.message}
            >
              <textarea
                ref={messageRef}
                id="contact-message"
                name="message"
                value={values.message}
                onChange={change("message")}
                onBlur={blur("message")}
                aria-invalid={errors.message ? true : undefined}
                aria-describedby={describe("message")}
                className={cn(fieldControl, "min-h-40 resize-none px-4 py-3")}
              />
            </FormField>

            {/* A trap for bots: people never see or reach this field. */}
            <div
              aria-hidden="true"
              className="absolute -left-[9999px] h-0 w-0 overflow-hidden"
            >
              <label>
                {form.website}
                <input
                  ref={honeypotRef}
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  defaultValue=""
                />
              </label>
            </div>

            <div data-reveal>
              <Button type="submit" size="lg" loading={status === "sending"}>
                {status === "sending" ? form.sending : form.send}
              </Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </Reveal>
  );
}
