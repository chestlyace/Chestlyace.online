import type {
  CodeTab,
  Compare,
  Diff,
  DiffLine,
  QuizQuestion,
  Step,
  Terminal,
  TreeEntry,
  Typewriter,
} from "./blocks";

// The other direction of lib/blog/blocks.ts: a block's data written back as the
// text of docs/blog-markdown.md §2, which `parseBlock` reads again unchanged. Each
// returns "" when nothing has been filled in, so an empty block writes nothing.
// Pure: no React.

const oneLine = (text: string) => text.replace(/\s*\n\s*/g, " ").trim();

const attr = (key: string, value: string) =>
  `${key}="${value.replace(/"/g, "'")}"`;

/** The attributes on a block's fence line. */
export const meta = (pairs: Record<string, string | null | undefined>) =>
  Object.entries(pairs)
    .filter(([, value]) => value && value.trim() !== "")
    .map(([key, value]) =>
      /^[\w./-]+$/.test(value!.trim())
        ? `${key}=${value!.trim()}`
        : attr(key, value!.trim()),
    )
    .join(" ");

// A line of only `---` would split the chunks, so a text line that is one is
// written as the equivalent `***`.
const guardRule = (text: string) => text.replace(/^---[ \t]*$/gm, "***");

export function stepsText(steps: readonly Step[]): string {
  const filled = steps.filter(
    (step) => step.title.trim() || step.text.trim() || step.icon,
  );
  return filled
    .map((step) =>
      [
        `## ${oneLine(step.title)}`,
        step.icon?.trim() ? `icon: ${step.icon.trim()}` : "",
        guardRule(step.text.trim()),
      ]
        .filter(Boolean)
        .join("\n"),
    )
    .join("\n---\n");
}

const cell = (text: string) => oneLine(text).replace(/\|/g, "\\|");

export function compareText(compare: Compare): string {
  const blank =
    !compare.title?.trim() &&
    [compare.header, ...compare.rows].every((row) =>
      row.every((text) => !text.trim()),
    );
  if (blank) return "";
  const row = (cells: string[]) => `| ${cells.map(cell).join(" | ")} |`;
  return [
    compare.title?.trim() ? `title: ${oneLine(compare.title)}` : "",
    compare.highlight !== null ? `highlight: ${compare.highlight + 1}` : "",
    row(compare.header),
    ...compare.rows.map(row),
  ]
    .filter(Boolean)
    .join("\n");
}

export function fileTreeText(entries: readonly TreeEntry[]): string {
  return entries
    .filter((entry) => entry.name.trim())
    .map((entry) => {
      const name = entry.name.trim();
      const note = entry.note?.trim() ? `  # ${oneLine(entry.note)}` : "";
      return `${"  ".repeat(entry.depth)}${entry.highlight ? "+ " : ""}${name}${note}`;
    })
    .join("\n");
}

export const typewriterMeta = (t: Pick<Typewriter, "lang" | "title">) =>
  meta({ lang: t.lang, title: t.title });

export function typewriterText(t: Typewriter): string {
  if (t.lines.every((line) => !line.code.trim())) return "";
  return t.lines
    .map((line) =>
      line.caption?.trim()
        ? `${line.code}  // @ ${oneLine(line.caption)}`
        : line.code,
    )
    .join("\n");
}

export function codeGroupText(tabs: readonly CodeTab[]): string {
  if (tabs.every((tab) => !tab.code.trim() && !tab.file?.trim())) return "";
  return tabs
    .map((tab) =>
      [
        `--- ${tab.lang.trim() || "text"}${tab.file?.trim() ? ` ${tab.file.trim()}` : ""}`,
        tab.code.replace(/\n+$/, ""),
      ].join("\n"),
    )
    .join("\n");
}

export const diffMeta = (d: Pick<Diff, "lang" | "title">) =>
  meta({ lang: d.lang, title: d.title });

export function diffText(d: Diff): string {
  if (d.lines.every((line) => !line.text.trim())) return "";
  return d.lines
    .map((line) =>
      line.type === "add"
        ? `+ ${line.text}`
        : line.type === "remove"
          ? `- ${line.text}`
          : `  ${line.text}`,
    )
    .join("\n");
}

export const terminalMeta = (t: Pick<Terminal, "title">) =>
  meta({ title: t.title });

export function terminalText(t: Terminal): string {
  if (t.rows.every((row) => !row.text.trim())) return "";
  return t.rows
    .map((row) =>
      row.type === "command"
        ? row.text
          ? `$ ${row.text}`
          : "$"
        : row.type === "comment"
          ? `# ${row.text}`
          : row.text,
    )
    .join("\n");
}

export function quizText(questions: readonly QuizQuestion[]): string {
  const filled = questions.filter(
    (q) => q.question.trim() || q.options.some((o) => o.text.trim()),
  );
  return filled
    .map((q) =>
      [
        `Q: ${oneLine(q.question)}`,
        ...q.options.map(
          (option) => `${option.correct ? "*)" : ")"} ${oneLine(option.text)}`,
        ),
        q.explanation?.trim() ? `E: ${oneLine(q.explanation)}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    )
    .join("\n---\n");
}

/** The lines of a diff computed from a before and an after text. */
export type { DiffLine };
