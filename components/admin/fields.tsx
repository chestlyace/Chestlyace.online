"use client";

import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import { useId, useRef, useState, type KeyboardEvent } from "react";
import { Button } from "@/components/shared/Button";
import { FormField, fieldControl } from "@/components/shared/FormField";
import { IconButton } from "@/components/shared/IconButton";
import { cn } from "@/lib/cn";
import type { FieldDef } from "@/lib/admin/config";
import { Switch } from "./Switch";
import { UploadField } from "./UploadField";

// The admin's field types (design.md §13.21): text, long text, URL, image
// address, date, select, switch, checkbox group and tag list, all in the filled
// style of §13.15. One component renders any field from its definition.

type Props = {
  field: FieldDef;
  value: string | boolean | string[];
  error?: string | null;
  onChange: (value: string | boolean | string[]) => void;
  onBlur: (fixed?: string) => void;
};

// "(optional)" after the label marks the optional fields; the rest need a value.
const COUNTER_FROM = 0.8;

function Counter({
  length,
  max,
  id,
}: {
  length: number;
  max: number;
  id: string;
}) {
  if (length < max * COUNTER_FROM) return null;
  return (
    <p
      id={id}
      className={cn(
        "mt-1.5 text-right text-sm",
        length > max ? "text-danger" : "text-muted",
      )}
    >
      {length} / {max}
    </p>
  );
}

// A web address typed without its scheme gets https:// when the field is left.
const withScheme = (value: string) =>
  value && !/^[a-z][a-z0-9+.-]*:/i.test(value) && !value.startsWith("/")
    ? `https://${value}`
    : value;

// Image fields also take paths on this site (`logos/a.png`, `resume.pdf`), so
// only something that starts like a host ("example.com/a.png") gets the scheme.
const imageWithScheme = (value: string) =>
  /^[a-z0-9-]+(\.[a-z0-9-]+)+\//i.test(value) ? withScheme(value) : value;

export function AdminField({ field, value, error, onChange, onBlur }: Props) {
  const uid = useId();
  const id = `field-${field.name}-${uid.replace(/:/g, "")}`;
  const describedBy =
    [error ? `${id}-error` : field.helper ? `${id}-help` : null]
      .filter(Boolean)
      .join(" ") || undefined;
  const invalid = error ? true : undefined;

  if (field.type === "switch") {
    return (
      <div className="flex items-start justify-between gap-6 rounded-lg bg-surface p-4">
        <div>
          <p id={`${id}-label`} className="text-sm font-medium text-foreground">
            {field.label}
          </p>
          {field.helper && (
            <p className="mt-0.5 text-sm text-muted">{field.helper}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="w-6 text-right text-sm text-muted"
          >
            {value ? "On" : "Off"}
          </span>
          <Switch
            checked={Boolean(value)}
            onChange={(next) => onChange(next)}
            label={field.label}
          />
        </div>
      </div>
    );
  }

  if (field.type === "checks") {
    const chosen = Array.isArray(value) ? value : [];
    return (
      <fieldset aria-describedby={describedBy}>
        <legend className="mb-2 text-sm font-medium text-foreground">
          {field.label}
        </legend>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {field.options.map(([optionValue, optionLabel]) => (
            <label
              key={optionValue}
              className="relative flex min-h-11 cursor-pointer items-center gap-2.5 text-body text-foreground"
            >
              <input
                type="checkbox"
                name={field.name}
                checked={chosen.includes(optionValue)}
                onChange={(event) =>
                  onChange(
                    event.target.checked
                      ? [...chosen, optionValue]
                      : chosen.filter((item) => item !== optionValue),
                  )
                }
                onBlur={() => onBlur()}
                className="size-5 accent-primary"
              />
              {optionLabel}
            </label>
          ))}
        </div>
        {error ? (
          <p id={`${id}-error`} className="pt-1 text-sm text-danger">
            {error}
          </p>
        ) : field.helper ? (
          <p id={`${id}-help`} className="pt-1 text-sm text-muted">
            {field.helper}
          </p>
        ) : null}
      </fieldset>
    );
  }

  if (field.type === "images") {
    return (
      <ImageList
        id={id}
        field={field}
        value={Array.isArray(value) ? value : []}
        error={error}
        describedBy={describedBy}
        onChange={onChange}
        onBlur={() => onBlur()}
      />
    );
  }

  if (field.type === "tags") {
    return (
      <TagList
        id={id}
        field={field}
        value={Array.isArray(value) ? value : []}
        error={error}
        describedBy={describedBy}
        onChange={onChange}
        onBlur={() => onBlur()}
      />
    );
  }

  const text = typeof value === "string" ? value : "";

  return (
    <FormField
      id={id}
      label={field.label}
      optional={field.optional}
      helper={field.helper}
      error={error}
    >
      {field.type === "long" ? (
        <>
          <textarea
            id={id}
            name={field.name}
            value={text}
            onChange={(event) => onChange(event.target.value)}
            onBlur={() => onBlur()}
            aria-invalid={invalid}
            aria-describedby={describedBy}
            rows={5}
            className={cn(
              fieldControl,
              "min-h-40 max-h-[30rem] resize-y px-4 py-3",
            )}
          />
          <Counter length={text.length} max={field.max} id={`${id}-count`} />
        </>
      ) : field.type === "select" ? (
        <select
          id={id}
          name={field.name}
          value={text}
          onChange={(event) => onChange(event.target.value)}
          onBlur={() => onBlur()}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          className={cn(fieldControl, "h-12 px-4", !text && "text-muted")}
        >
          <option value="" disabled>
            Choose…
          </option>
          {field.options.map(([optionValue, optionLabel]) => (
            <option
              key={optionValue}
              value={optionValue}
              className="text-foreground"
            >
              {optionLabel}
            </option>
          ))}
        </select>
      ) : field.type === "slug" ? (
        <>
          <div className="flex items-center rounded-md bg-(--field-fill,var(--tile)) shadow-[inset_0_0_0_1px_var(--border)] focus-within:shadow-none focus-within:outline-2 focus-within:outline-ring [&:has([aria-invalid=true])]:shadow-[inset_0_0_0_1px_var(--danger)]">
            <span
              aria-hidden="true"
              className="hidden pl-4 text-[1.0625rem] text-muted select-none sm:block"
            >
              {field.prefix}
            </span>
            <input
              id={id}
              name={field.name}
              type="text"
              autoComplete="off"
              spellCheck={false}
              value={text}
              onChange={(event) => onChange(event.target.value)}
              onBlur={() => onBlur()}
              aria-invalid={invalid}
              aria-describedby={describedBy}
              className="h-12 min-w-0 flex-1 bg-transparent px-4 text-[1.0625rem] text-foreground outline-none sm:pl-0"
            />
          </div>
          <p className="mt-1.5 text-sm break-all text-muted">
            {field.prefix}
            {text || "…"}
          </p>
        </>
      ) : field.type === "date" ? (
        <div className="flex items-center gap-3">
          <input
            id={id}
            name={field.name}
            type="date"
            value={text}
            onChange={(event) => onChange(event.target.value)}
            onBlur={() => onBlur()}
            aria-invalid={invalid}
            aria-describedby={describedBy}
            className={cn(fieldControl, "h-12 max-w-56 px-4")}
          />
          {text && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="link-inline rounded-sm text-sm text-muted"
            >
              Clear
            </button>
          )}
        </div>
      ) : field.type === "image" ? (
        <UploadField
          id={id}
          name={field.name}
          use={field.use}
          value={text}
          onChange={onChange}
          onBlur={() => {
            const fixed = imageWithScheme(text.trim());
            if (fixed !== text) onChange(fixed);
            onBlur(fixed);
          }}
          invalid={Boolean(error)}
          describedBy={describedBy}
        />
      ) : (
        <>
          <input
            id={id}
            name={field.name}
            type="text"
            inputMode={field.type === "url" ? "url" : undefined}
            autoComplete="off"
            spellCheck={field.type === "text" ? undefined : false}
            placeholder={
              field.type === "text"
                ? field.placeholder
                : field.type === "url"
                  ? "https://…"
                  : undefined
            }
            value={text}
            onChange={(event) => onChange(event.target.value)}
            onBlur={() => {
              if (field.type === "url") {
                const fixed = withScheme(text.trim());
                if (fixed !== text) onChange(fixed);
                onBlur(fixed);
                return;
              }
              onBlur();
            }}
            aria-invalid={invalid}
            aria-describedby={describedBy}
            className={cn(fieldControl, "h-12 px-4")}
          />
          {field.type === "text" && (
            <Counter length={text.length} max={field.max} id={`${id}-count`} />
          )}
        </>
      )}
    </FormField>
  );
}

// Chips with a text box (design.md §13.21): Enter or comma adds, Backspace on
// an empty box removes the last chip, each chip has a remove button, and Alt+←
// and Alt+→ on a focused chip move it.
function TagList({
  id,
  field,
  value,
  error,
  describedBy,
  onChange,
  onBlur,
}: {
  id: string;
  field: Extract<FieldDef, { type: "tags" }>;
  value: string[];
  error?: string | null;
  describedBy?: string;
  onChange: (value: string[]) => void;
  onBlur: () => void;
}) {
  const [draft, setDraft] = useState("");
  const [notice, setNotice] = useState("");
  const chips = useRef<(HTMLButtonElement | null)[]>([]);

  const add = (raw: string) => {
    const item = raw.trim();
    if (!item) return;
    if (
      value.some((existing) => existing.toLowerCase() === item.toLowerCase())
    ) {
      setNotice(`“${item}” is already there.`);
      return;
    }
    if (value.length >= field.max) {
      setNotice(`At most ${field.max} ${field.itemLabel}s.`);
      return;
    }
    setNotice("");
    onChange([...value, item]);
    setDraft("");
  };

  const onKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      add(draft);
    } else if (event.key === "Backspace" && draft === "" && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const move = (index: number, by: -1 | 1) => {
    const target = index + by;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
    requestAnimationFrame(() => chips.current[target]?.focus());
  };

  return (
    <FormField
      id={id}
      label={field.label}
      optional={field.optional}
      helper={notice ? undefined : field.helper}
      error={error}
    >
      <div
        className={cn(
          fieldControl,
          "flex min-h-12 flex-wrap items-center gap-2 px-3 py-2",
        )}
        aria-invalid={error ? true : undefined}
      >
        {value.map((item, index) => (
          <span
            key={item}
            className="type-label inline-flex h-7 items-center gap-1 rounded-sm bg-tile-hover pr-1 pl-2.5 text-foreground"
          >
            {item}
            <button
              type="button"
              ref={(node) => {
                chips.current[index] = node;
              }}
              aria-label={`Remove ${item}`}
              aria-keyshortcuts="Alt+ArrowLeft Alt+ArrowRight"
              onClick={() => onChange(value.filter((_, i) => i !== index))}
              onKeyDown={(event) => {
                if (event.altKey && event.key === "ArrowLeft") {
                  event.preventDefault();
                  move(index, -1);
                } else if (event.altKey && event.key === "ArrowRight") {
                  event.preventDefault();
                  move(index, 1);
                }
              }}
              className="grid size-5 place-items-center rounded-sm text-muted hover:text-foreground"
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          </span>
        ))}
        <input
          id={id}
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKey}
          onBlur={() => {
            add(draft);
            onBlur();
          }}
          autoComplete="off"
          aria-describedby={describedBy}
          placeholder={value.length === 0 ? `Add a ${field.itemLabel}…` : ""}
          className="min-w-32 flex-1 bg-transparent py-1 text-[1.0625rem] text-foreground outline-none placeholder:text-muted"
        />
      </div>
      {notice && (
        <p role="status" className="mt-1.5 text-sm text-muted">
          {notice}
        </p>
      )}
    </FormField>
  );
}

// The gallery (design.md §13.21): one address per image, in the order the page
// shows them; each is an upload box (or an address) and can move up or down or
// be removed.
function ImageList({
  id,
  field,
  value,
  error,
  describedBy,
  onChange,
  onBlur,
}: {
  id: string;
  field: Extract<FieldDef, { type: "images" }>;
  value: string[];
  error?: string | null;
  describedBy?: string;
  onChange: (value: string[]) => void;
  onBlur: () => void;
}) {
  const set = (index: number, next: string) =>
    onChange(value.map((item, i) => (i === index ? next : item)));
  const move = (index: number, by: -1 | 1) => {
    const target = index + by;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <FormField
      id={id}
      label={field.label}
      optional={field.optional}
      helper={field.helper}
      error={error}
    >
      <ul className="flex flex-col gap-3">
        {value.map((item, index) => (
          <li key={index} className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <UploadField
                id={index === 0 ? id : `${id}-${index}`}
                name={field.name}
                use={field.use}
                value={item}
                compact
                onChange={(next) => set(index, next)}
                onBlur={() => {
                  const fixed = imageWithScheme(item.trim());
                  if (fixed !== item) set(index, fixed);
                  onBlur();
                }}
                invalid={Boolean(error)}
                describedBy={describedBy}
              />
            </div>
            <IconButton
              label={`Move image ${index + 1} up`}
              iconKey="up"
              disabled={index === 0}
              onClick={() => move(index, -1)}
            >
              <ArrowUp className="size-[1.125rem]" />
            </IconButton>
            <IconButton
              label={`Move image ${index + 1} down`}
              iconKey="down"
              disabled={index === value.length - 1}
              onClick={() => move(index, 1)}
            >
              <ArrowDown className="size-[1.125rem]" />
            </IconButton>
            <IconButton
              label={`Remove image ${index + 1}`}
              iconKey="remove"
              onClick={() => onChange(value.filter((_, i) => i !== index))}
              className="hover:text-danger"
            >
              <X className="size-[1.125rem]" />
            </IconButton>
          </li>
        ))}
      </ul>
      {value.length < field.max && (
        <Button
          variant="secondary"
          size="sm"
          magnetic={false}
          trailingIcon={<Plus />}
          iconNudge="none"
          onClick={() => onChange([...value, ""])}
          className={value.length > 0 ? "mt-3" : undefined}
        >
          Add image
        </Button>
      )}
    </FormField>
  );
}
