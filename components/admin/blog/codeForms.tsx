"use client";

import { Trash2 } from "lucide-react";
import { useId, useState } from "react";
import { IconButton } from "@/components/shared/IconButton";
import type { CodeTab, Diff, DiffLine, Typewriter } from "@/lib/blog/blocks";
import { diffFromTexts, textsFromDiff } from "@/lib/blog/editorTools";
import { CODE_LANGUAGES } from "@/lib/blog/languages";
import { cn } from "@/lib/cn";
import {
  AddButton,
  Card,
  LanguageInput,
  TextArea,
  TextInput,
  inputClass,
  moved,
  replaced,
} from "./formParts";

type Props<T> = { data: T; onChange: (next: T) => void };

// ---- typewriter ----------------------------------------------------------------------

export function TypewriterForm({ data, onChange }: Props<Typewriter>) {
  const id = useId();
  const [open, setOpen] = useState<number | null>(null);

  // Editing the code keeps each line's caption by its position.
  const setCode = (code: string) => {
    const rows = code.split("\n");
    onChange({
      ...data,
      lines: rows.map((row, i) => ({
        code: row,
        caption: data.lines[i]?.caption ?? null,
      })),
    });
  };

  return (
    <div className="grid gap-4 [&>*]:min-w-0">
      <div className="grid gap-4 sm:grid-cols-2 [&>*]:min-w-0">
        <LanguageInput
          value={data.lang}
          onChange={(lang) => onChange({ ...data, lang })}
          languages={CODE_LANGUAGES}
        />
        <TextInput
          label="File name"
          optional
          placeholder="proxy.ts"
          value={data.title ?? ""}
          onChange={(title) => onChange({ ...data, title: title || null })}
        />
      </div>
      <TextArea
        label="Code"
        mono
        rows={8}
        value={data.lines.map((line) => line.code).join("\n")}
        onChange={setCode}
        helper="It types itself out when the reader reaches it."
      />
      <div>
        <p className="mb-2 text-sm font-medium text-foreground">
          Captions{" "}
          <span className="font-normal text-muted">
            (click a line to add one)
          </span>
        </p>
        <ol
          aria-label="Lines"
          className="overflow-hidden rounded-lg bg-surface"
        >
          {data.lines.map((line, index) => (
            <li key={index} className="border-b border-border last:border-b-0">
              <button
                type="button"
                aria-expanded={open === index}
                aria-controls={`${id}-cap-${index}`}
                onClick={() => setOpen(open === index ? null : index)}
                className="flex min-h-9 w-full items-center gap-3 px-3 py-1 text-left font-mono text-[0.875rem] text-foreground hover:bg-tile-hover"
              >
                <span
                  aria-hidden="true"
                  className="w-6 shrink-0 text-right text-muted"
                >
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1 truncate whitespace-pre">
                  {line.code || " "}
                </span>
                {line.caption && (
                  <span className="type-label shrink-0 text-primary-text">
                    Caption
                  </span>
                )}
              </button>
              {open === index && (
                <div id={`${id}-cap-${index}`} className="px-3 pb-3">
                  <input
                    aria-label={`Caption for line ${index + 1}`}
                    autoFocus
                    value={line.caption ?? ""}
                    placeholder="What this line does"
                    onChange={(event) =>
                      onChange({
                        ...data,
                        lines: replaced(data.lines, index, {
                          ...line,
                          caption: event.target.value || null,
                        }),
                      })
                    }
                    className={cn(inputClass, "h-10 text-[0.9375rem]")}
                  />
                </div>
              )}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

// ---- code group ----------------------------------------------------------------------

export function CodeGroupForm({ data, onChange }: Props<CodeTab[]>) {
  return (
    <div className="grid gap-4">
      <ol className="grid gap-4">
        {data.map((tab, index) => (
          <Card
            key={index}
            label={`Tab ${index + 1}${tab.file ? `: ${tab.file}` : ""}`}
            index={index}
            total={data.length}
            onMove={(to) => onChange(moved(data, index, to))}
            onRemove={() => onChange(data.filter((_, i) => i !== index))}
            canRemove={data.length > 1}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <LanguageInput
                value={tab.lang}
                onChange={(lang) =>
                  onChange(replaced(data, index, { ...tab, lang }))
                }
                languages={CODE_LANGUAGES}
              />
              <TextInput
                label="File name"
                optional
                value={tab.file ?? ""}
                onChange={(file) =>
                  onChange(
                    replaced(data, index, { ...tab, file: file || null }),
                  )
                }
              />
            </div>
            <TextArea
              label="Code"
              mono
              rows={6}
              value={tab.code}
              onChange={(code) =>
                onChange(replaced(data, index, { ...tab, code }))
              }
            />
          </Card>
        ))}
      </ol>
      <AddButton
        onClick={() =>
          onChange([
            ...data,
            { lang: data.at(-1)?.lang ?? "ts", file: null, code: "" },
          ])
        }
      >
        Add a tab
      </AddButton>
    </div>
  );
}

// ---- diff ----------------------------------------------------------------------------

const SIGNS: [DiffLine["type"], string][] = [
  ["same", "Unchanged"],
  ["remove", "Removed"],
  ["add", "Added"],
];

export function DiffForm({ data, onChange }: Props<Diff>) {
  const [direct, setDirect] = useState(false);
  const { before, after } = textsFromDiff(data.lines);
  const setLines = (lines: DiffLine[]) => onChange({ ...data, lines });

  return (
    <div className="grid gap-4 [&>*]:min-w-0">
      <div className="grid gap-4 sm:grid-cols-2 [&>*]:min-w-0">
        <LanguageInput
          value={data.lang}
          onChange={(lang) => onChange({ ...data, lang })}
          languages={CODE_LANGUAGES}
        />
        <TextInput
          label="File name"
          optional
          value={data.title ?? ""}
          onChange={(title) => onChange({ ...data, title: title || null })}
        />
      </div>
      <div
        className="flex gap-1 rounded-full bg-surface p-1 self-start w-fit"
        role="group"
        aria-label="How to edit the diff"
      >
        {[
          [false, "Before and after"],
          [true, "Edit the lines"],
        ].map(([value, label]) => (
          <button
            key={String(value)}
            type="button"
            aria-pressed={direct === value}
            onClick={() => setDirect(value as boolean)}
            className={cn(
              "h-9 rounded-full px-4 text-sm font-medium transition-colors duration-150",
              direct === value
                ? "bg-surface-raised text-foreground shadow-sm"
                : "text-muted hover:text-foreground",
            )}
          >
            {label as string}
          </button>
        ))}
      </div>

      {direct ? (
        <ol aria-label="Diff lines" className="grid gap-2">
          {data.lines.map((line, index) => (
            <li key={index} className="flex items-center gap-2">
              <select
                aria-label={`Kind, line ${index + 1}`}
                value={line.type}
                onChange={(event) =>
                  setLines(
                    replaced(data.lines, index, {
                      ...line,
                      type: event.target.value as DiffLine["type"],
                    }),
                  )
                }
                className={cn(
                  inputClass,
                  "h-10 w-36! shrink-0 text-[0.9375rem]",
                )}
              >
                {SIGNS.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <input
                aria-label={`Text, line ${index + 1}`}
                value={line.text}
                spellCheck={false}
                onChange={(event) =>
                  setLines(
                    replaced(data.lines, index, {
                      ...line,
                      text: event.target.value,
                    }),
                  )
                }
                className={cn(
                  inputClass,
                  "h-10 min-w-0 flex-1 font-mono text-[0.9375rem]",
                )}
              />
              <IconButton
                label={`Remove line ${index + 1}`}
                iconKey="remove"
                disabled={data.lines.length <= 1}
                onClick={() =>
                  setLines(data.lines.filter((_, i) => i !== index))
                }
                className="size-8 hover:text-danger"
              >
                <Trash2 className="size-4" />
              </IconButton>
            </li>
          ))}
          <li>
            <AddButton
              onClick={() =>
                setLines([...data.lines, { type: "same", text: "" }])
              }
            >
              Add a line
            </AddButton>
          </li>
        </ol>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <TextArea
            label="Before"
            mono
            rows={8}
            value={before}
            onChange={(text) => setLines(diffFromTexts(text, after))}
          />
          <TextArea
            label="After"
            mono
            rows={8}
            value={after}
            onChange={(text) => setLines(diffFromTexts(before, text))}
          />
        </div>
      )}

      <div>
        <p className="mb-2 text-sm font-medium text-foreground">The diff</p>
        <div
          role="region"
          aria-label="Computed diff"
          tabIndex={0}
          className="overflow-x-auto rounded-lg bg-surface py-2 font-mono text-[0.875rem] leading-[1.6] outline-none focus-visible:outline-2 focus-visible:outline-ring"
        >
          {data.lines.map((line, index) => (
            <div
              key={index}
              className={cn(
                "flex min-w-max whitespace-pre",
                line.type === "add" &&
                  "bg-[color-mix(in_srgb,var(--diff-add)_12%,transparent)]",
                line.type === "remove" && "bg-danger/10",
              )}
            >
              <span
                aria-hidden="true"
                className="w-8 shrink-0 text-center text-muted select-none"
              >
                {line.type === "add" ? "+" : line.type === "remove" ? "−" : " "}
              </span>
              <span className="sr-only">
                {line.type === "add"
                  ? "Added: "
                  : line.type === "remove"
                    ? "Removed: "
                    : ""}
              </span>
              <span className="pr-4 text-foreground">{line.text || " "}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
