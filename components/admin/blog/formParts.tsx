"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { DynamicIcon, iconNames, type IconName } from "lucide-react/dynamic";
import { useId, type ReactNode } from "react";
import { FormField, fieldControl } from "@/components/shared/FormField";
import { IconButton } from "@/components/shared/IconButton";
import { cn } from "@/lib/cn";

// Pieces the interactive blocks' forms share (design.md §13.48).

export const inputClass = cn(fieldControl, "h-12 px-4");
export const areaClass = cn(fieldControl, "resize-y px-4 py-3");
export const monoClass =
  "font-mono text-[0.9375rem] leading-[1.6] whitespace-pre";

export function TextInput({
  label,
  value,
  onChange,
  optional,
  helper,
  placeholder,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  optional?: boolean;
  helper?: string;
  placeholder?: string;
  className?: string;
}) {
  const id = useId();
  return (
    <FormField
      id={id}
      label={label}
      optional={optional}
      helper={helper}
      className={className}
    >
      <input
        id={id}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={inputClass}
      />
    </FormField>
  );
}

export function TextArea({
  label,
  value,
  onChange,
  rows = 3,
  mono,
  optional,
  helper,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  mono?: boolean;
  optional?: boolean;
  helper?: string;
}) {
  const id = useId();
  return (
    <FormField id={id} label={label} optional={optional} helper={helper}>
      <textarea
        id={id}
        rows={rows}
        spellCheck={mono ? false : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn(areaClass, mono && monoClass)}
      />
    </FormField>
  );
}

// A language, searched from a list or typed.
export function LanguageInput({
  label = "Language",
  value,
  onChange,
  languages,
  optional,
}: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  languages: readonly string[];
  optional?: boolean;
}) {
  const id = useId();
  return (
    <FormField id={id} label={label} optional={optional}>
      <input
        id={id}
        list={`${id}-list`}
        value={value}
        placeholder="Search, e.g. ts"
        onChange={(event) => onChange(event.target.value.trim().toLowerCase())}
        className={inputClass}
      />
      <datalist id={`${id}-list`}>
        {languages.map((language) => (
          <option key={language} value={language} />
        ))}
      </datalist>
    </FormField>
  );
}

// A Lucide icon by name from a searchable list, or `brand:github` for a brand logo
// (docs/blog-markdown.md). The chosen icon is shown beside the box.
export function IconPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const id = useId();
  const known = (iconNames as readonly string[]).includes(value);
  return (
    <FormField
      id={id}
      label="Icon"
      optional
      helper="Search Lucide icons, or write brand:github for a brand logo."
    >
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="grid size-12 shrink-0 place-items-center rounded-md bg-surface text-foreground"
        >
          {known ? (
            <DynamicIcon name={value as IconName} className="size-5" />
          ) : null}
        </span>
        <input
          id={id}
          list={`${id}-icons`}
          value={value}
          placeholder="e.g. rocket"
          onChange={(event) => onChange(event.target.value.trim())}
          className={inputClass}
        />
        <datalist id={`${id}-icons`}>
          {iconNames.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
      </div>
    </FormField>
  );
}

// One item of a list of cards: its name, Move up, Move down and Remove.
export function Card({
  label,
  index,
  total,
  onMove,
  onRemove,
  canRemove = true,
  children,
}: {
  label: string;
  index: number;
  total: number;
  onMove: (to: number) => void;
  onRemove: () => void;
  canRemove?: boolean;
  children: ReactNode;
}) {
  return (
    <li className="rounded-lg bg-surface-raised p-3 shadow-[inset_0_0_0_1px_var(--border)] sm:p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="type-label text-muted">{label}</p>
        <div className="flex items-center">
          <IconButton
            label={`Move ${label} up`}
            iconKey="up"
            disabled={index === 0}
            onClick={() => onMove(index - 1)}
          >
            <ArrowUp className="size-[1.125rem]" />
          </IconButton>
          <IconButton
            label={`Move ${label} down`}
            iconKey="down"
            disabled={index === total - 1}
            onClick={() => onMove(index + 1)}
          >
            <ArrowDown className="size-[1.125rem]" />
          </IconButton>
          <IconButton
            label={`Remove ${label}`}
            iconKey="remove"
            disabled={!canRemove}
            onClick={onRemove}
            className="hover:text-danger focus-visible:text-danger"
          >
            <Trash2 className="size-[1.125rem]" />
          </IconButton>
        </div>
      </div>
      <div className="grid gap-4 [&>*]:min-w-0">{children}</div>
    </li>
  );
}

export function AddButton({
  onClick,
  children,
  disabled,
  icon,
}: {
  onClick: () => void;
  children: ReactNode;
  disabled?: boolean;
  /** Replaces the "+". */
  icon?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex h-10 w-fit items-center gap-1.5 rounded-full bg-surface px-4 text-sm font-medium text-foreground transition-colors duration-150 hover:bg-tile-hover disabled:opacity-50"
    >
      {icon ?? <Plus className="size-4" aria-hidden="true" />}
      {children}
    </button>
  );
}

/** `items` with the one at `from` moved to `to`. */
export function moved<T>(items: readonly T[], from: number, to: number): T[] {
  if (to < 0 || to >= items.length) return [...items];
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/** `items` with the one at `index` replaced. */
export const replaced = <T,>(
  items: readonly T[],
  index: number,
  item: T,
): T[] => items.map((existing, i) => (i === index ? item : existing));
