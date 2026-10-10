"use client";

import { CircleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  adminConfig,
  emptyFrenchValues,
  englishValues,
  frenchFields,
  isFrName,
  toValues,
  translatableNames,
  translationsBody,
  validate,
  type AdminConfig,
  type AdminRow,
  type Values,
} from "@/lib/admin/config";
import { slugify } from "@/lib/admin/order";
import { findEditable } from "@/lib/admin/resources";
import { AdminField } from "./fields";
import { SaveBar } from "./SaveBar";
import { useConfirm } from "./ConfirmDialog";
import { useToast } from "./Toast";
import { useUnsavedChanges } from "./UnsavedGuard";

const same = (a: Values, b: Values) => JSON.stringify(a) === JSON.stringify(b);

// One entry's editor (design.md §13.21, §13.25): fields from the resource's
// definition, checked when you leave them and again on save, and a save bar.
// `itemId` set means editing; otherwise it creates a new entry.
export function EditorForm({
  resourceId,
  itemId,
  initial,
}: {
  resourceId: string;
  itemId?: number;
  initial: Values;
}) {
  const config = adminConfig(resourceId) as AdminConfig;
  const resource = findEditable(resourceId)!;
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();

  // The French fields start empty for a new entry (docs/i18n.md §10).
  const start = { ...emptyFrenchValues(config), ...initial };
  const [values, setValues] = useState<Values>(start);
  const [saved, setSaved] = useState<Values>(start);
  const hasFrench = translatableNames(config).length > 0;
  const [lang, setLang] = useState<"en" | "fr">("en");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedRecently, setSavedRecently] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const timer = useRef<number | undefined>(undefined);

  // Editing an existing entry (or the profile, which always exists) sends only
  // what changed; a new entry sends everything.
  const editing = Boolean(itemId) || Boolean(config.single);

  // A new project's address follows its title until it is typed in by hand.
  const [slugTouched, setSlugTouched] = useState(editing);
  const slugField = config.groups
    .flatMap((group) => group.fields)
    .find((field) => field.type === "slug");

  const dirty = !same(values, saved);
  useUnsavedChanges(dirty);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const check = (name: string, next: Values = values) => {
    const found = validate(config, next)[name];
    setErrors((current) => {
      const { [name]: _removed, ...rest } = current;
      void _removed;
      return found ? { ...rest, [name]: found } : rest;
    });
  };

  const change = (name: string, value: string | boolean | string[]) => {
    const next = { ...values, [name]: value };
    if (slugField?.type === "slug") {
      if (name === slugField.name) setSlugTouched(true);
      else if (
        name === slugField.from &&
        !slugTouched &&
        typeof value === "string"
      ) {
        next[slugField.name] = slugify(value);
      }
    }
    setValues(next);
    // Once a field has shown an error it is re-checked as you type.
    if (errors[name]) check(name, next);
  };

  const cancel = async () => {
    if (
      dirty &&
      !(await confirm({
        title: "Leave without saving?",
        text: "Your changes to this entry will be lost.",
        confirmLabel: "Discard changes",
        tone: "primary",
      }))
    ) {
      return;
    }
    // Leaving on purpose: the guard must not ask again.
    setSaved(values);
    router.push(resource.href);
  };

  // Focus a field once it is on screen (a French field needs the French view first).
  const focusField = (name: string) => {
    window.setTimeout(() => {
      formRef.current
        ?.querySelector<HTMLElement>(`[name="${name}"], [id^="field-${name}-"]`)
        ?.focus();
    }, 0);
  };

  const save = async (event?: FormEvent) => {
    event?.preventDefault();
    if (saving || !dirty) return;

    const found = validate(config, values);
    setErrors(found);
    setFormError(null);
    const fields = [
      ...config.groups.flatMap((group) => group.fields),
      ...frenchFields(config, values),
    ];
    const first = fields.find((field) => found[field.name]);
    if (first) {
      // An error in a French field shows the French fields first.
      if (isFrName(first.name)) setLang("fr");
      focusField(first.name);
      return;
    }

    // Editing sends what changed; a new entry sends everything.
    const english = englishValues(values);
    const frenchChanged = Object.keys(values).some(
      (key) =>
        isFrName(key) &&
        JSON.stringify(values[key]) !== JSON.stringify(saved[key]),
    );
    const translations = translationsBody(values);
    const hasTranslations = Object.keys(translations.fr).length > 0;
    const body = {
      ...(editing
        ? Object.fromEntries(
            Object.entries(english).filter(
              ([key, value]) =>
                JSON.stringify(value) !== JSON.stringify(saved[key]),
            ),
          )
        : english),
      // The French is sent whole (replacing what was stored) when it changed.
      ...(editing
        ? frenchChanged
          ? { translations }
          : {}
        : hasTranslations
          ? { translations }
          : {}),
    };

    setSaving(true);
    try {
      const response = await fetch(
        itemId
          ? `/api/admin/${resource.api}/${itemId}`
          : `/api/admin/${resource.api}`,
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const result = (await response.json().catch(() => ({}))) as {
        item?: AdminRow;
        fields?: Record<string, string>;
      };

      if (response.ok) {
        // What the server kept (trimmed text, a WhatsApp number as digits) is
        // what the form shows from now on.
        const kept = result.item ? toValues(config, result.item) : values;
        setSaved(kept);
        setValues(kept);
        const live = !config.hasPublished || values.isPublished === true;
        toast.success(
          live
            ? "Saved. It's live on the site."
            : "Saved. It's a draft, so it isn't on the site yet.",
        );
        if (editing) {
          setSavedRecently(true);
          window.clearTimeout(timer.current);
          timer.current = window.setTimeout(
            () => setSavedRecently(false),
            3000,
          );
          router.refresh();
        } else if (result.item) {
          router.replace(`${resource.href}/${result.item.id}`);
        }
      } else if (response.status === 401) {
        toast.error("Your session ended. Sign in again.");
        router.replace(
          `/login?reason=expired&next=${encodeURIComponent(window.location.pathname)}`,
        );
      } else if (response.status === 422 && result.fields) {
        const { _: general, ...rest } = result.fields;
        setErrors(rest);
        setFormError(general ?? null);
        const bad = fields.find((field) => rest[field.name]);
        if (bad) {
          if (isFrName(bad.name)) setLang("fr");
          focusField(bad.name);
        }
      } else {
        setFormError("Couldn't save. Check your connection and try again.");
      }
    } catch {
      setFormError("Couldn't save. Check your connection and try again.");
    }
    setSaving(false);
  };

  return (
    <form
      ref={formRef}
      onSubmit={save}
      noValidate
      aria-label={editing ? `Edit ${resource.noun}` : `New ${resource.noun}`}
      onKeyDown={(event) => {
        if (
          (event.metaKey || event.ctrlKey) &&
          event.key.toLowerCase() === "s"
        ) {
          event.preventDefault();
          void save();
        }
      }}
      className="max-w-[45rem] pb-28"
    >
      {formError && (
        <p
          role="alert"
          className="mb-6 flex items-start gap-2 rounded-lg bg-surface-raised p-4 text-sm text-danger"
        >
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {formError}
        </p>
      )}

      {hasFrench && (
        <div
          role="tablist"
          aria-label="Language"
          className="mb-8 inline-flex rounded-full border border-border bg-tile p-1"
        >
          {(
            [
              ["en", "English"],
              ["fr", "Français"],
            ] as const
          ).map(([code, name]) => (
            <button
              key={code}
              type="button"
              role="tab"
              id={`tab-${code}`}
              aria-selected={lang === code}
              aria-controls="editor-fields"
              onClick={() => setLang(code)}
              className={
                "type-label h-9 rounded-full px-5 transition-colors duration-150 " +
                (lang === code
                  ? "bg-primary text-primary-foreground"
                  : "text-muted hover:text-foreground")
              }
            >
              {name}
            </button>
          ))}
        </div>
      )}

      <div
        id="editor-fields"
        role={hasFrench ? "tabpanel" : undefined}
        aria-labelledby={hasFrench ? `tab-${lang}` : undefined}
      >
        {lang === "fr" && hasFrench ? (
          <div lang="fr" className="flex flex-col gap-6">
            {frenchFields(config, values).map((field) => (
              <AdminField
                key={field.name}
                field={field}
                value={values[field.name]}
                error={errors[field.name]}
                onChange={(value) => change(field.name, value)}
                onBlur={(fixed) =>
                  check(
                    field.name,
                    fixed === undefined
                      ? values
                      : { ...values, [field.name]: fixed },
                  )
                }
              />
            ))}
          </div>
        ) : (
          config.groups.map((group, index) => (
            <div
              key={group.title ?? index}
              className={
                group.title ? "mt-10 border-t border-border pt-6" : undefined
              }
            >
              {group.title && <h2 className="mb-5 text-h3">{group.title}</h2>}
              <div className="flex flex-col gap-6">
                {group.fields.map((field) => (
                  <AdminField
                    key={field.name}
                    field={
                      field.type === "slug" && itemId
                        ? {
                            ...field,
                            helper:
                              "Changing the address breaks links to the old one.",
                          }
                        : field
                    }
                    value={values[field.name]}
                    error={errors[field.name]}
                    onChange={(value) => change(field.name, value)}
                    onBlur={(fixed) =>
                      check(
                        field.name,
                        fixed === undefined
                          ? values
                          : { ...values, [field.name]: fixed },
                      )
                    }
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <SaveBar
        dirty={dirty}
        saving={saving}
        savedRecently={savedRecently}
        onCancel={cancel}
      />
    </form>
  );
}
