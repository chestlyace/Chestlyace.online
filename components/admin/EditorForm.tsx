"use client";

import { CircleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  adminConfig,
  validate,
  type AdminConfig,
  type Values,
} from "@/lib/admin/config";
import { findResource } from "@/lib/admin/resources";
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
  const resource = findResource(resourceId)!;
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();

  const [values, setValues] = useState<Values>(initial);
  const [saved, setSaved] = useState<Values>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedRecently, setSavedRecently] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const timer = useRef<number | undefined>(undefined);

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

  const save = async (event?: FormEvent) => {
    event?.preventDefault();
    if (saving || !dirty) return;

    const found = validate(config, values);
    setErrors(found);
    setFormError(null);
    const fields = config.groups.flatMap((group) => group.fields);
    const first = fields.find((field) => found[field.name]);
    if (first) {
      formRef.current
        ?.querySelector<HTMLElement>(
          `[name="${first.name}"], [id^="field-${first.name}-"]`,
        )
        ?.focus();
      return;
    }

    // Editing sends what changed; a new entry sends everything.
    const body = itemId
      ? Object.fromEntries(
          Object.entries(values).filter(
            ([key, value]) =>
              JSON.stringify(value) !== JSON.stringify(saved[key]),
          ),
        )
      : values;

    setSaving(true);
    try {
      const response = await fetch(
        itemId
          ? `/api/admin/${resource.api}/${itemId}`
          : `/api/admin/${resource.api}`,
        {
          method: itemId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const result = (await response.json().catch(() => ({}))) as {
        item?: { id: number };
        fields?: Record<string, string>;
      };

      if (response.ok) {
        setSaved(values);
        const live = !config.hasPublished || values.isPublished === true;
        toast.success(
          live
            ? "Saved. It's live on the site."
            : "Saved. It's a draft, so it isn't on the site yet.",
        );
        if (itemId) {
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
        if (bad)
          formRef.current
            ?.querySelector<HTMLElement>(
              `[name="${bad.name}"], [id^="field-${bad.name}-"]`,
            )
            ?.focus();
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
      aria-label={itemId ? `Edit ${resource.noun}` : `New ${resource.noun}`}
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

      {config.groups.map((group, index) => (
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
                field={field}
                value={values[field.name]}
                error={errors[field.name]}
                onChange={(value) => change(field.name, value)}
                onBlur={() => check(field.name)}
              />
            ))}
          </div>
        </div>
      ))}

      <SaveBar
        dirty={dirty}
        saving={saving}
        savedRecently={savedRecently}
        onCancel={cancel}
      />
    </form>
  );
}
