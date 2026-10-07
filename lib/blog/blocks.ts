import { parseFenceMeta } from "./meta";

// Parsers for the rich blocks of docs/blog-markdown.md §2. Each turns a block's
// text into plain data (or an error message, so the renderer can fall back to a
// code block). Pure: no React, no highlighting.

export type Result<T> = { ok: true; data: T } | { ok: false; error: string };
const ok = <T>(data: T): Result<T> => ({ ok: true, data });
const fail = <T>(error: string): Result<T> => ({ ok: false, error });

const lines = (body: string) => body.replace(/\r\n?/g, "\n").split("\n");

/** Chunks separated by a line holding only `---`. */
const chunks = (body: string) =>
  body
    .replace(/\r\n?/g, "\n")
    .split(/^---[ \t]*$/m)
    .map((chunk) => chunk.replace(/^\n+|\n+$/g, ""))
    .filter((chunk) => chunk.trim() !== "");

// ---- steps ---------------------------------------------------------------------

export type Step = { title: string; icon: string | null; text: string };

export function parseSteps(body: string): Result<Step[]> {
  const steps: Step[] = [];
  for (const chunk of chunks(body)) {
    const rows = lines(chunk);
    const heading = rows.findIndex((row) => row.trim() !== "");
    const match = rows[heading]?.match(/^##\s+(.+?)\s*$/);
    if (!match) return fail("Each step starts with a line like “## Title”.");
    let icon: string | null = null;
    const rest = rows.slice(heading + 1);
    const iconAt = rest.findIndex((row) => /^icon:\s*\S+/i.test(row.trim()));
    if (
      iconAt !== -1 &&
      rest.slice(0, iconAt).every((row) => row.trim() === "")
    ) {
      icon = rest[iconAt].trim().replace(/^icon:\s*/i, "");
      rest.splice(iconAt, 1);
    }
    steps.push({ title: match[1], icon, text: rest.join("\n").trim() });
  }
  return steps.length > 0 ? ok(steps) : fail("There are no steps.");
}

// ---- compare -------------------------------------------------------------------

export type Compare = {
  title: string | null;
  /** The recommended column, counting from 0. */
  highlight: number | null;
  header: string[];
  rows: string[][];
};

function cells(row: string): string[] {
  const inner = row.trim().replace(/^\|/, "").replace(/\|$/, "");
  return inner
    .split(/(?<!\\)\|/)
    .map((cell) => cell.trim().replace(/\\\|/g, "|"));
}

export function parseCompare(body: string): Result<Compare> {
  let title: string | null = null;
  let highlight: number | null = null;
  const table: string[][] = [];
  for (const row of lines(body)) {
    const text = row.trim();
    if (text === "") continue;
    const titled = text.match(/^title:\s*(.+)$/i);
    const marked = text.match(/^highlight:\s*(\d+)$/i);
    if (titled && table.length === 0) title = titled[1];
    else if (marked && table.length === 0) highlight = Number(marked[1]) - 1;
    else if (text.startsWith("|")) {
      if (/^\|?[\s:|-]+\|?$/.test(text) && text.includes("-")) continue;
      table.push(cells(text));
    } else
      return fail("A comparison is a title line and rows like “| a | b |”.");
  }
  if (table.length === 0) return fail("The comparison has no rows.");
  const [header, ...rows] = table;
  const width = Math.max(header.length, ...rows.map((row) => row.length));
  const pad = (row: string[]) => [
    ...row,
    ...Array(width - row.length).fill(""),
  ];
  if (highlight !== null && (highlight < 0 || highlight >= width))
    highlight = null;
  return ok({ title, highlight, header: pad(header), rows: rows.map(pad) });
}

// ---- file tree -----------------------------------------------------------------

export type TreeEntry = {
  name: string;
  depth: number;
  folder: boolean;
  note: string | null;
  highlight: boolean;
};

export function parseFileTree(body: string): Result<TreeEntry[]> {
  const rows = lines(body).filter((row) => row.trim() !== "");
  if (rows.length === 0) return fail("The file tree is empty.");
  const drawn = rows.some((row) => /[├└]──/.test(row));
  const entries: TreeEntry[] = [];
  for (const row of rows) {
    let depth: number;
    let rest: string;
    if (drawn) {
      const prefix = row.match(/^[\s│|]*(?:[├└]──\s*)?/)![0];
      depth = Math.round(prefix.replace(/[├└]──\s*/, "    ").length / 4);
      rest = row.slice(prefix.length);
    } else {
      const spaces = row.match(/^ */)![0].length;
      depth = Math.floor(spaces / 2);
      rest = row.slice(spaces);
    }
    let highlight = false;
    if (rest.startsWith("+ ")) {
      highlight = true;
      rest = rest.slice(2);
    }
    let note: string | null = null;
    const split = rest.match(/^(.*?)\s{2,}#\s?(.*)$/);
    if (split) {
      rest = split[1];
      note = split[2].trim() || null;
    }
    const name = rest.trim();
    if (name === "") return fail("A file tree line has no name.");
    entries.push({ name, depth, folder: name.endsWith("/"), note, highlight });
  }
  return ok(entries);
}

// ---- typewriter ----------------------------------------------------------------

export type TypewriterLine = { code: string; caption: string | null };
export type Typewriter = {
  lang: string;
  title: string | null;
  lines: TypewriterLine[];
};

export function parseTypewriter(
  body: string,
  meta: string | null,
): Result<Typewriter> {
  const { values } = parseFenceMeta(meta);
  const out: TypewriterLine[] = [];
  for (const row of lines(body.replace(/\n+$/, ""))) {
    const caption = row.match(/^(.*?)\s*\/\/ @\s?(.*)$/);
    out.push(
      caption
        ? {
            code: caption[1].replace(/\s+$/, ""),
            caption: caption[2].trim() || null,
          }
        : { code: row, caption: null },
    );
  }
  if (out.every((line) => line.code.trim() === ""))
    return fail("There is no code.");
  return ok({
    lang: values.lang ?? "text",
    title: values.title ?? null,
    lines: out,
  });
}

// ---- code group ----------------------------------------------------------------

export type CodeTab = { lang: string; file: string | null; code: string };

export function parseCodeGroup(body: string): Result<CodeTab[]> {
  const tabs: CodeTab[] = [];
  let current: { lang: string; file: string | null; rows: string[] } | null =
    null;
  for (const row of lines(body)) {
    const header = row.match(/^---\s+(\S+)(?:\s+(.+?))?\s*$/);
    if (header) {
      if (current)
        tabs.push({
          lang: current.lang,
          file: current.file,
          code: current.rows.join("\n").replace(/\n+$/, ""),
        });
      current = { lang: header[1], file: header[2] ?? null, rows: [] };
    } else if (current) current.rows.push(row);
    else if (row.trim() !== "")
      return fail("Each tab starts with “--- language file-name”.");
  }
  if (current)
    tabs.push({
      lang: current.lang,
      file: current.file,
      code: current.rows.join("\n").replace(/\n+$/, ""),
    });
  return tabs.length > 0 ? ok(tabs) : fail("There are no tabs.");
}

// ---- diff ----------------------------------------------------------------------

export type DiffLine = { type: "add" | "remove" | "same"; text: string };
export type Diff = { lang: string; title: string | null; lines: DiffLine[] };

export function parseDiff(body: string, meta: string | null): Result<Diff> {
  const { values } = parseFenceMeta(meta);
  const out: DiffLine[] = [];
  for (const row of lines(body.replace(/\n+$/, ""))) {
    if (row.startsWith("+"))
      out.push({ type: "add", text: row.slice(row[1] === " " ? 2 : 1) });
    else if (row.startsWith("-"))
      out.push({ type: "remove", text: row.slice(row[1] === " " ? 2 : 1) });
    else
      out.push({
        type: "same",
        text: row.startsWith("  ") ? row.slice(2) : row,
      });
  }
  if (out.length === 0) return fail("The diff is empty.");
  return ok({
    lang: values.lang ?? "text",
    title: values.title ?? null,
    lines: out,
  });
}

// ---- terminal ------------------------------------------------------------------

export type TerminalRow = {
  type: "command" | "output" | "comment";
  text: string;
};
export type Terminal = { title: string | null; rows: TerminalRow[] };

export function parseTerminal(
  body: string,
  meta: string | null,
): Result<Terminal> {
  const { values } = parseFenceMeta(meta);
  const rows: TerminalRow[] = lines(body.replace(/\n+$/, "")).map((row) => {
    if (row.startsWith("$ ")) return { type: "command", text: row.slice(2) };
    if (row === "$") return { type: "command", text: "" };
    if (row.startsWith("# ")) return { type: "comment", text: row.slice(2) };
    return { type: "output", text: row };
  });
  if (!rows.some((row) => row.type === "command"))
    return fail("A terminal needs at least one “$ command”.");
  return ok({ title: values.title ?? null, rows });
}

// ---- flow ----------------------------------------------------------------------

export const FLOW_STYLES = [
  "blue",
  "green",
  "orange",
  "purple",
  "teal",
  "red",
  "gray",
] as const;
export type FlowStyle = (typeof FLOW_STYLES)[number];

export type FlowNode = {
  id: string;
  label: string;
  icon: string | null;
  style: FlowStyle;
  desc: string | null;
  pos: { x: number; y: number } | null;
  group: boolean;
  dir: "h" | "v";
  parent: string | null;
};
export type FlowEdge = { from: string; to: string; label: string | null };
export type Flow = { nodes: FlowNode[]; edges: FlowEdge[] };

export function parseFlow(body: string): Result<Flow> {
  const nodes: FlowNode[] = [];
  const edges: FlowEdge[] = [];
  for (const row of lines(body)) {
    const text = row.trim();
    if (text === "") continue;
    const node = text.match(/^\[([^\]]+)\]\s*(.*)$/);
    if (node) {
      const [id, ...parts] = node[1].split("|").map((part) => part.trim());
      if (!/^[\w-]+$/.test(id)) return fail(`“${id}” is not a valid box id.`);
      const entry: FlowNode = {
        id,
        label: node[2].trim() || id,
        icon: null,
        style: "gray",
        desc: null,
        pos: null,
        group: false,
        dir: "h",
        parent: null,
      };
      for (const part of parts) {
        const [key, ...rest] = part.split(":");
        const value = rest.join(":").trim();
        if (key === "group") entry.group = true;
        else if (key === "icon") entry.icon = value || null;
        else if (key === "style") {
          if (!(FLOW_STYLES as readonly string[]).includes(value))
            return fail(
              `“${value}” is not a colour (use ${FLOW_STYLES.join(", ")}).`,
            );
          entry.style = value as FlowStyle;
        } else if (key === "desc") entry.desc = value || null;
        else if (key === "dir") entry.dir = value === "v" ? "v" : "h";
        else if (key === "parent") entry.parent = value || null;
        else if (key === "pos") {
          const [x, y] = value.split(",").map(Number);
          if (!Number.isFinite(x) || !Number.isFinite(y))
            return fail(`“pos:${value}” should be x,y.`);
          entry.pos = { x, y };
        }
      }
      if (nodes.some((other) => other.id === id))
        return fail(`The box id “${id}” is used twice.`);
      nodes.push(entry);
      continue;
    }
    const edge = text.match(/^([\w-]+)\s*-->\s*([\w-]+)(?:\s*:\s*(.*))?$/);
    if (edge) {
      edges.push({
        from: edge[1],
        to: edge[2],
        label: edge[3]?.trim() || null,
      });
      continue;
    }
    return fail(`I couldn't read this line: “${text.slice(0, 60)}”.`);
  }
  if (nodes.length === 0) return fail("The diagram has no boxes.");
  const ids = new Set(nodes.map((node) => node.id));
  for (const edge of edges)
    for (const id of [edge.from, edge.to])
      if (!ids.has(id))
        return fail(`An arrow points at “${id}”, which isn't a box.`);
  for (const node of nodes)
    if (
      node.parent &&
      !nodes.some((other) => other.id === node.parent && other.group)
    )
      return fail(
        `The box “${node.id}” says it is inside “${node.parent}”, which isn't a group.`,
      );
  return ok({ nodes, edges });
}

// ---- quiz ----------------------------------------------------------------------

export type QuizQuestion = {
  question: string;
  options: { text: string; correct: boolean }[];
  explanation: string | null;
};

export function parseQuiz(body: string): Result<QuizQuestion[]> {
  const questions: QuizQuestion[] = [];
  for (const chunk of chunks(body)) {
    let question = "";
    const options: QuizQuestion["options"] = [];
    let explanation: string | null = null;
    let target: "question" | "explanation" | null = null;
    for (const row of lines(chunk)) {
      const text = row.trim();
      if (/^Q:/i.test(text)) {
        question = text.replace(/^Q:\s*/i, "");
        target = "question";
      } else if (/^\*\)/.test(text)) {
        options.push({ text: text.slice(2).trim(), correct: true });
        target = null;
      } else if (/^\)/.test(text)) {
        options.push({ text: text.slice(1).trim(), correct: false });
        target = null;
      } else if (/^E:/i.test(text)) {
        explanation = text.replace(/^E:\s*/i, "");
        target = "explanation";
      } else if (text !== "" && target === "question") question += ` ${text}`;
      else if (text !== "" && target === "explanation")
        explanation += ` ${text}`;
    }
    if (!question) return fail("A quiz question starts with “Q:”.");
    if (options.length < 2)
      return fail(`“${question.slice(0, 40)}” needs at least two options.`);
    if (options.filter((option) => option.correct).length !== 1)
      return fail(
        `“${question.slice(0, 40)}” needs exactly one right answer, marked “*)”.`,
      );
    questions.push({ question, options, explanation });
  }
  return questions.length > 0 ? ok(questions) : fail("There are no questions.");
}

// ---- dispatch ------------------------------------------------------------------

export const BLOCK_NAMES = [
  "steps",
  "compare",
  "filetree",
  "typewriter",
  "codegroup",
  "diff",
  "terminal",
  "flow",
  "quiz",
] as const;
export type BlockName = (typeof BLOCK_NAMES)[number];

export const isBlockName = (
  name: string | null | undefined,
): name is BlockName =>
  !!name && (BLOCK_NAMES as readonly string[]).includes(name);

export function parseBlock(
  name: BlockName,
  body: string,
  meta: string | null,
): Result<unknown> {
  switch (name) {
    case "steps":
      return parseSteps(body);
    case "compare":
      return parseCompare(body);
    case "filetree":
      return parseFileTree(body);
    case "typewriter":
      return parseTypewriter(body, meta);
    case "codegroup":
      return parseCodeGroup(body);
    case "diff":
      return parseDiff(body, meta);
    case "terminal":
      return parseTerminal(body, meta);
    case "flow":
      return parseFlow(body);
    case "quiz":
      return parseQuiz(body);
  }
}
