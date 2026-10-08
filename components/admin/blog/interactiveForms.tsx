"use client";

import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from "lucide-react";
import { useId, useRef, useState } from "react";
import { FormField } from "@/components/shared/FormField";
import { IconButton } from "@/components/shared/IconButton";
import type {
  Compare,
  QuizQuestion,
  Step,
  Terminal,
  TerminalRow,
  TreeEntry,
} from "@/lib/blog/blocks";
import {
  shiftEntry,
  terminalFromPaste,
  treeFromPaste,
} from "@/lib/blog/editorTools";
import { cn } from "@/lib/cn";
import {
  AddButton,
  Card,
  IconPicker,
  TextArea,
  TextInput,
  areaClass,
  inputClass,
  monoClass,
  moved,
  replaced,
} from "./formParts";

type Props<T> = { data: T; onChange: (next: T) => void };

// ---- steps ---------------------------------------------------------------------------

export function StepsForm({ data, onChange }: Props<Step[]>) {
  return (
    <div className="grid gap-4">
      <ol className="grid gap-4">
        {data.map((step, index) => (
          <Card
            key={index}
            label={`Step ${index + 1}`}
            index={index}
            total={data.length}
            onMove={(to) => onChange(moved(data, index, to))}
            onRemove={() => onChange(data.filter((_, i) => i !== index))}
            canRemove={data.length > 1}
          >
            <IconPicker
              value={step.icon ?? ""}
              onChange={(icon) =>
                onChange(replaced(data, index, { ...step, icon: icon || null }))
              }
            />
            <TextInput
              label="Title"
              value={step.title}
              onChange={(title) =>
                onChange(replaced(data, index, { ...step, title }))
              }
            />
            <TextArea
              label="Text"
              value={step.text}
              onChange={(text) =>
                onChange(replaced(data, index, { ...step, text }))
              }
              helper="Bold, links and `code` work."
            />
          </Card>
        ))}
      </ol>
      <AddButton
        onClick={() => onChange([...data, { title: "", icon: null, text: "" }])}
      >
        Add a step
      </AddButton>
    </div>
  );
}

// ---- compare -------------------------------------------------------------------------

export function CompareForm({ data, onChange }: Props<Compare>) {
  const id = useId();
  const width = data.header.length;
  const setCell = (row: number, column: number, text: string) =>
    onChange({
      ...data,
      rows: data.rows.map((cells, r) =>
        r === row ? replaced(cells, column, text) : cells,
      ),
    });

  return (
    <div className="grid gap-4">
      <TextInput
        label="Title"
        optional
        value={data.title ?? ""}
        onChange={(title) => onChange({ ...data, title: title || null })}
      />
      <div
        role="region"
        aria-label="Comparison grid"
        tabIndex={0}
        className="overflow-x-auto rounded-lg outline-none focus-visible:outline-2 focus-visible:outline-ring"
      >
        <table className="w-full min-w-max border-separate border-spacing-2">
          <thead>
            <tr>
              {data.header.map((text, column) => (
                <th
                  key={column}
                  scope="col"
                  className="min-w-40 text-left align-bottom font-normal"
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    {column > 0 ? (
                      <label className="flex items-center gap-1.5 text-sm text-muted">
                        <input
                          type="radio"
                          name={`${id}-recommended`}
                          checked={data.highlight === column}
                          onChange={() =>
                            onChange({ ...data, highlight: column })
                          }
                          className="size-4 accent-primary"
                        />
                        Recommended
                      </label>
                    ) : (
                      <span className="text-sm text-muted">Row labels</span>
                    )}
                    {width > 2 && column > 0 && (
                      <IconButton
                        label={`Remove column ${column + 1}`}
                        iconKey="remove"
                        onClick={() =>
                          onChange({
                            ...data,
                            highlight:
                              data.highlight === null
                                ? null
                                : data.highlight === column
                                  ? null
                                  : data.highlight > column
                                    ? data.highlight - 1
                                    : data.highlight,
                            header: data.header.filter((_, c) => c !== column),
                            rows: data.rows.map((cells) =>
                              cells.filter((_, c) => c !== column),
                            ),
                          })
                        }
                        className="size-8 hover:text-danger"
                      >
                        <Trash2 className="size-4" />
                      </IconButton>
                    )}
                  </div>
                  <input
                    aria-label={`Heading, column ${column + 1}`}
                    value={text}
                    onChange={(event) =>
                      onChange({
                        ...data,
                        header: replaced(
                          data.header,
                          column,
                          event.target.value,
                        ),
                      })
                    }
                    className={cn(inputClass, "font-semibold")}
                  />
                </th>
              ))}
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {data.rows.map((cells, row) => (
              <tr key={row}>
                {cells.map((text, column) => (
                  <td key={column}>
                    <input
                      aria-label={`Row ${row + 1}, column ${column + 1}`}
                      value={text}
                      onChange={(event) =>
                        setCell(row, column, event.target.value)
                      }
                      className={inputClass}
                    />
                  </td>
                ))}
                <td>
                  <IconButton
                    label={`Remove row ${row + 1}`}
                    iconKey="remove"
                    disabled={data.rows.length <= 1}
                    onClick={() =>
                      onChange({
                        ...data,
                        rows: data.rows.filter((_, r) => r !== row),
                      })
                    }
                    className="hover:text-danger"
                  >
                    <Trash2 className="size-[1.125rem]" />
                  </IconButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap gap-2">
        <AddButton
          onClick={() =>
            onChange({ ...data, rows: [...data.rows, Array(width).fill("")] })
          }
        >
          Add a row
        </AddButton>
        <AddButton
          disabled={width >= 6}
          onClick={() =>
            onChange({
              ...data,
              header: [...data.header, ""],
              rows: data.rows.map((cells) => [...cells, ""]),
            })
          }
        >
          Add a column
        </AddButton>
      </div>
    </div>
  );
}

// ---- file tree -----------------------------------------------------------------------

const bare = (name: string) => name.replace(/\/$/, "");

export function FileTreeForm({ data, onChange }: Props<TreeEntry[]>) {
  const id = useId();
  const names = useRef<(HTMLInputElement | null)[]>([]);
  const [pasting, setPasting] = useState(false);
  const [paste, setPaste] = useState("");
  const [pasteError, setPasteError] = useState<string | null>(null);

  const set = (index: number, change: Partial<TreeEntry>) =>
    onChange(replaced(data, index, { ...data[index], ...change }));

  const addAfter = (index: number) => {
    const next = [...data];
    next.splice(index + 1, 0, {
      name: "",
      depth: data[index]?.depth ?? 0,
      folder: false,
      note: null,
      highlight: false,
    });
    onChange(next);
    requestAnimationFrame(() => names.current[index + 1]?.focus());
  };

  return (
    <div className="grid gap-4">
      <p className="text-sm text-muted">
        One row per file or folder. Tab and Shift+Tab in a name indent and
        outdent it.
      </p>
      <ol aria-label="Files and folders" className="grid gap-2">
        {data.map((entry, index) => (
          <li
            key={index}
            className="flex flex-wrap items-center gap-2 rounded-md bg-surface-raised p-2 shadow-[inset_0_0_0_1px_var(--border)]"
          >
            <span className="flex items-center">
              <IconButton
                label={`Outdent row ${index + 1}`}
                iconKey="out"
                disabled={entry.depth === 0}
                onClick={() => onChange(shiftEntry(data, index, -1))}
                className="size-8"
              >
                <ChevronLeft className="size-4" />
              </IconButton>
              <IconButton
                label={`Indent row ${index + 1}`}
                iconKey="in"
                onClick={() => onChange(shiftEntry(data, index, 1))}
                className="size-8"
              >
                <ChevronRight className="size-4" />
              </IconButton>
            </span>
            <input
              ref={(element) => {
                names.current[index] = element;
              }}
              aria-label={`Name, row ${index + 1}`}
              value={bare(entry.name)}
              style={{ marginLeft: `${entry.depth * 1.25}rem` }}
              placeholder="name"
              onChange={(event) =>
                set(index, {
                  name: event.target.value + (entry.folder ? "/" : ""),
                })
              }
              onKeyDown={(event) => {
                if (event.key === "Tab") {
                  event.preventDefault();
                  onChange(shiftEntry(data, index, event.shiftKey ? -1 : 1));
                } else if (event.key === "Enter") {
                  event.preventDefault();
                  addAfter(index);
                }
              }}
              className={cn(
                inputClass,
                "h-10 min-w-40 flex-1 font-mono text-[0.9375rem]",
              )}
            />
            <label className="flex items-center gap-1.5 text-sm text-foreground">
              <input
                type="checkbox"
                checked={entry.folder}
                onChange={(event) =>
                  set(index, {
                    folder: event.target.checked,
                    name: bare(entry.name) + (event.target.checked ? "/" : ""),
                  })
                }
                className="size-4 accent-primary"
              />
              Folder
            </label>
            <label className="flex items-center gap-1.5 text-sm text-foreground">
              <input
                type="checkbox"
                checked={entry.highlight}
                onChange={(event) =>
                  set(index, { highlight: event.target.checked })
                }
                className="size-4 accent-primary"
              />
              Highlight
            </label>
            <input
              aria-label={`Note, row ${index + 1}`}
              value={entry.note ?? ""}
              placeholder="Note (optional)"
              onChange={(event) =>
                set(index, { note: event.target.value || null })
              }
              className={cn(
                inputClass,
                "h-10 min-w-40 flex-1 text-[0.9375rem]",
              )}
            />
            <span className="flex items-center">
              <IconButton
                label={`Move row ${index + 1} up`}
                iconKey="up"
                disabled={index === 0}
                onClick={() => onChange(moved(data, index, index - 1))}
                className="size-8"
              >
                <ArrowUp className="size-4" />
              </IconButton>
              <IconButton
                label={`Move row ${index + 1} down`}
                iconKey="down"
                disabled={index === data.length - 1}
                onClick={() => onChange(moved(data, index, index + 1))}
                className="size-8"
              >
                <ArrowDown className="size-4" />
              </IconButton>
              <IconButton
                label={`Remove row ${index + 1}`}
                iconKey="remove"
                disabled={data.length <= 1}
                onClick={() => onChange(data.filter((_, i) => i !== index))}
                className="size-8 hover:text-danger"
              >
                <Trash2 className="size-4" />
              </IconButton>
            </span>
          </li>
        ))}
      </ol>
      <div className="flex flex-wrap gap-2">
        <AddButton onClick={() => addAfter(data.length - 1)}>
          Add a row
        </AddButton>
        <AddButton onClick={() => setPasting((value) => !value)}>
          Paste <code className="font-mono">tree</code> output
        </AddButton>
      </div>
      {pasting && (
        <div className="grid gap-3 rounded-lg bg-surface p-3">
          <FormField id={`${id}-paste`} label="Pasted tree" error={pasteError}>
            <textarea
              id={`${id}-paste`}
              rows={6}
              spellCheck={false}
              value={paste}
              onChange={(event) => setPaste(event.target.value)}
              className={cn(areaClass, monoClass)}
            />
          </FormField>
          <div>
            <AddButton
              onClick={() => {
                const entries = treeFromPaste(paste);
                if (!entries) {
                  setPasteError("There is nothing to read there.");
                  return;
                }
                setPasteError(null);
                setPasting(false);
                setPaste("");
                onChange(entries);
              }}
            >
              Use this tree
            </AddButton>
          </div>
        </div>
      )}
    </div>
  );
}

// ---- terminal ------------------------------------------------------------------------

const ROW_TYPES: [TerminalRow["type"], string][] = [
  ["command", "Command"],
  ["output", "Output"],
  ["comment", "Comment"],
];

export function TerminalForm({ data, onChange }: Props<Terminal>) {
  const id = useId();
  const [pasting, setPasting] = useState(false);
  const [paste, setPaste] = useState("");
  const setRow = (index: number, row: TerminalRow) =>
    onChange({ ...data, rows: replaced(data.rows, index, row) });

  return (
    <div className="grid gap-4">
      <TextInput
        label="Title"
        optional
        placeholder="zsh"
        value={data.title ?? ""}
        onChange={(title) => onChange({ ...data, title: title || null })}
      />
      <ol aria-label="Terminal rows" className="grid gap-2">
        {data.rows.map((row, index) => (
          <li key={index} className="flex flex-wrap items-center gap-2">
            <select
              aria-label={`Type, row ${index + 1}`}
              value={row.type}
              onChange={(event) =>
                setRow(index, {
                  ...row,
                  type: event.target.value as TerminalRow["type"],
                })
              }
              className={cn(inputClass, "h-10 w-32! shrink-0 text-[0.9375rem]")}
            >
              {ROW_TYPES.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <input
              aria-label={`Text, row ${index + 1}`}
              value={row.text}
              spellCheck={false}
              onChange={(event) =>
                setRow(index, { ...row, text: event.target.value })
              }
              className={cn(
                inputClass,
                "h-10 min-w-40 flex-1 font-mono text-[0.9375rem]",
              )}
            />
            <span className="flex items-center">
              <IconButton
                label={`Move row ${index + 1} up`}
                iconKey="up"
                disabled={index === 0}
                onClick={() =>
                  onChange({
                    ...data,
                    rows: moved(data.rows, index, index - 1),
                  })
                }
                className="size-8"
              >
                <ArrowUp className="size-4" />
              </IconButton>
              <IconButton
                label={`Move row ${index + 1} down`}
                iconKey="down"
                disabled={index === data.rows.length - 1}
                onClick={() =>
                  onChange({
                    ...data,
                    rows: moved(data.rows, index, index + 1),
                  })
                }
                className="size-8"
              >
                <ArrowDown className="size-4" />
              </IconButton>
              <IconButton
                label={`Remove row ${index + 1}`}
                iconKey="remove"
                disabled={data.rows.length <= 1}
                onClick={() =>
                  onChange({
                    ...data,
                    rows: data.rows.filter((_, i) => i !== index),
                  })
                }
                className="size-8 hover:text-danger"
              >
                <Trash2 className="size-4" />
              </IconButton>
            </span>
          </li>
        ))}
      </ol>
      <div className="flex flex-wrap gap-2">
        <AddButton
          onClick={() =>
            onChange({
              ...data,
              rows: [...data.rows, { type: "command", text: "" }],
            })
          }
        >
          Add a command
        </AddButton>
        <AddButton
          onClick={() =>
            onChange({
              ...data,
              rows: [...data.rows, { type: "output", text: "" }],
            })
          }
        >
          Add output
        </AddButton>
        <AddButton onClick={() => setPasting((value) => !value)}>
          Paste a terminal session
        </AddButton>
      </div>
      {pasting && (
        <div className="grid gap-3 rounded-lg bg-surface p-3">
          <FormField
            id={`${id}-paste`}
            label="Pasted session"
            helper="Lines starting with $ or % become commands; the rest is output."
          >
            <textarea
              id={`${id}-paste`}
              rows={6}
              spellCheck={false}
              value={paste}
              onChange={(event) => setPaste(event.target.value)}
              className={cn(areaClass, monoClass)}
            />
          </FormField>
          <div>
            <AddButton
              onClick={() => {
                if (!paste.trim()) return;
                onChange({ ...data, rows: terminalFromPaste(paste) });
                setPasting(false);
                setPaste("");
              }}
            >
              Use this session
            </AddButton>
          </div>
        </div>
      )}
    </div>
  );
}

// ---- quiz ----------------------------------------------------------------------------

export function QuizForm({ data, onChange }: Props<QuizQuestion[]>) {
  const id = useId();
  const set = (index: number, question: QuizQuestion) =>
    onChange(replaced(data, index, question));

  return (
    <div className="grid gap-4">
      <ol className="grid gap-4">
        {data.map((question, index) => (
          <Card
            key={index}
            label={`Question ${index + 1}`}
            index={index}
            total={data.length}
            onMove={(to) => onChange(moved(data, index, to))}
            onRemove={() => onChange(data.filter((_, i) => i !== index))}
            canRemove={data.length > 1}
          >
            <TextInput
              label="Question"
              value={question.question}
              onChange={(text) => set(index, { ...question, question: text })}
            />
            <fieldset className="grid gap-2">
              <legend className="mb-1 text-sm font-medium text-foreground">
                Options{" "}
                <span className="font-normal text-muted">
                  (select the right answer)
                </span>
              </legend>
              {question.options.map((option, o) => (
                <div key={o} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`${id}-${index}-right`}
                    aria-label={`Option ${o + 1} is the right answer`}
                    checked={option.correct}
                    onChange={() =>
                      set(index, {
                        ...question,
                        options: question.options.map((existing, i) => ({
                          ...existing,
                          correct: i === o,
                        })),
                      })
                    }
                    className="size-5 shrink-0 accent-primary"
                  />
                  <input
                    aria-label={`Option ${o + 1}`}
                    value={option.text}
                    onChange={(event) =>
                      set(index, {
                        ...question,
                        options: replaced(question.options, o, {
                          ...option,
                          text: event.target.value,
                        }),
                      })
                    }
                    className={cn(inputClass, "h-10 flex-1 text-[0.9375rem]")}
                  />
                  <IconButton
                    label={`Remove option ${o + 1}`}
                    iconKey="remove"
                    disabled={question.options.length <= 2}
                    onClick={() => {
                      const options = question.options.filter(
                        (_, i) => i !== o,
                      );
                      if (!options.some((x) => x.correct))
                        options[0] = { ...options[0], correct: true };
                      set(index, { ...question, options });
                    }}
                    className="size-8 hover:text-danger"
                  >
                    <Trash2 className="size-4" />
                  </IconButton>
                </div>
              ))}
              <div>
                <AddButton
                  disabled={question.options.length >= 4}
                  onClick={() =>
                    set(index, {
                      ...question,
                      options: [
                        ...question.options,
                        { text: "", correct: false },
                      ],
                    })
                  }
                >
                  Add an option
                </AddButton>
              </div>
            </fieldset>
            <TextArea
              label="Explanation"
              optional
              value={question.explanation ?? ""}
              onChange={(text) =>
                set(index, { ...question, explanation: text || null })
              }
              helper="Shown after the reader answers."
            />
          </Card>
        ))}
      </ol>
      <AddButton
        onClick={() =>
          onChange([
            ...data,
            {
              question: "",
              options: [
                { text: "", correct: true },
                { text: "", correct: false },
              ],
              explanation: null,
            },
          ])
        }
      >
        Add a question
      </AddButton>
    </div>
  );
}
