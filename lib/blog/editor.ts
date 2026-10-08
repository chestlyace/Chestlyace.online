import type { Code, Image, List, ListItem, Paragraph, Root } from "mdast";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";
import {
  isBlockName,
  parseBlock,
  type BlockName,
  type CodeTab,
  type Compare,
  type Diff,
  type Flow,
  type QuizQuestion,
  type Step,
  type Terminal,
  type TreeEntry,
  type Typewriter,
} from "./blocks";
import {
  codeGroupText,
  compareText,
  diffMeta,
  diffText,
  fileTreeText,
  quizText,
  stepsText,
  terminalMeta,
  terminalText,
  typewriterMeta,
  typewriterText,
} from "./blockText";
import { emptyFlow, flowText } from "./flowEdit";
import { parseFenceMeta } from "./meta";

// The block editor's model (design.md §13.48): a post is a list of blocks, each
// filled in with a form, and the markdown of docs/blog-markdown.md is what they
// write and read. Pure (no React, no highlighting), so the editor and its tests
// share it. Blocks without a form yet (steps, quiz…: 9b.3b, 9b.3c) are kept
// intact as `raw` blocks, so a post that has them is never changed by opening it.
// The interactive blocks (steps, compare…) have forms; a block is only read into
// its form when the form writes it back so that it reads the same.

export type CalloutKind = "note" | "tip" | "warning";

type Base = { id: string };

export type EditorBlock =
  | (Base & { type: "paragraph"; text: string })
  | (Base & { type: "heading"; level: 2 | 3 | 4; text: string })
  | (Base & { type: "quote"; text: string })
  | (Base & { type: "list"; ordered: boolean; items: string[] })
  | (Base & {
      type: "callout";
      kind: CalloutKind;
      title: string;
      text: string;
    })
  | (Base & { type: "divider" })
  | (Base & {
      type: "image";
      src: string;
      alt: string;
      decorative: boolean;
      caption: string;
      wide: boolean;
    })
  | (Base & {
      type: "code";
      lang: string;
      file: string;
      code: string;
      /** The lines to highlight, as written: `2, 4-6`. */
      highlight: string;
      lineNumbers: boolean;
    })
  | (Base & { type: "steps"; data: Step[] })
  | (Base & { type: "compare"; data: Compare })
  | (Base & { type: "filetree"; data: TreeEntry[] })
  | (Base & { type: "typewriter"; data: Typewriter })
  | (Base & { type: "codegroup"; data: CodeTab[] })
  | (Base & { type: "diff"; data: Diff })
  | (Base & { type: "terminal"; data: Terminal })
  | (Base & { type: "quiz"; data: QuizQuestion[] })
  | (Base & { type: "flow"; data: Flow })
  | (Base & {
      type: "session";
      /** The stored session (`agent_sessions`); empty until one is uploaded. */
      sessionId: string;
      /** The first and last turn shown; null means from the start / to the end. */
      from: number | null;
      to: number | null;
      title: string;
    })
  | (Base & { type: "raw"; markdown: string });

export type BlockType = EditorBlock["type"];

let counter = 0;
export const newBlockId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `b${++counter}`;

// A new, empty block of a type.
export function emptyBlock(
  type: BlockType,
  id: string = newBlockId(),
): EditorBlock {
  switch (type) {
    case "paragraph":
      return { id, type, text: "" };
    case "heading":
      return { id, type, level: 2, text: "" };
    case "quote":
      return { id, type, text: "" };
    case "list":
      return { id, type, ordered: false, items: [""] };
    case "callout":
      return { id, type, kind: "note", title: "", text: "" };
    case "divider":
      return { id, type };
    case "image":
      return {
        id,
        type,
        src: "",
        alt: "",
        decorative: false,
        caption: "",
        wide: false,
      };
    case "code":
      return {
        id,
        type,
        lang: "",
        file: "",
        code: "",
        highlight: "",
        lineNumbers: false,
      };
    case "steps":
      return { id, type, data: [{ title: "", icon: null, text: "" }] };
    case "compare":
      return {
        id,
        type,
        data: {
          title: null,
          highlight: null,
          header: ["", "", ""],
          rows: [["", "", ""]],
        },
      };
    case "filetree":
      return {
        id,
        type,
        data: [
          { name: "", depth: 0, folder: false, note: null, highlight: false },
        ],
      };
    case "typewriter":
      return {
        id,
        type,
        data: { lang: "ts", title: null, lines: [{ code: "", caption: null }] },
      };
    case "codegroup":
      return {
        id,
        type,
        data: [
          { lang: "ts", file: null, code: "" },
          { lang: "json", file: null, code: "" },
        ],
      };
    case "diff":
      return {
        id,
        type,
        data: { lang: "ts", title: null, lines: [{ type: "same", text: "" }] },
      };
    case "terminal":
      return {
        id,
        type,
        data: { title: null, rows: [{ type: "command", text: "" }] },
      };
    case "quiz":
      return {
        id,
        type,
        data: [
          {
            question: "",
            options: [
              { text: "", correct: true },
              { text: "", correct: false },
            ],
            explanation: null,
          },
        ],
      };
    case "flow":
      return { id, type, data: emptyFlow() };
    case "session":
      return { id, type, sessionId: "", from: null, to: null, title: "" };
    case "raw":
      return { id, type, markdown: "" };
  }
}

// ---- blocks → markdown -----------------------------------------------------------

// A fence long enough that nothing inside can close it.
function fence(info: string, body: string): string {
  const longest = Math.max(
    0,
    ...[...body.matchAll(/`{3,}/g)].map((run) => run[0].length),
  );
  const ticks = "`".repeat(Math.max(3, longest + 1));
  return `${ticks}${info}\n${body}\n${ticks}`;
}

const attribute = (key: string, value: string) =>
  `${key}="${value.replace(/"/g, "'")}"`;

export function blockToMarkdown(block: EditorBlock): string {
  switch (block.type) {
    case "paragraph":
      return block.text.trim();
    case "heading": {
      const text = block.text.replace(/\s*\n\s*/g, " ").trim();
      return text ? `${"#".repeat(block.level)} ${text}` : "";
    }
    case "quote": {
      const text = block.text.trim();
      return text
        ? text
            .split("\n")
            .map((line) => (line ? `> ${line}` : ">"))
            .join("\n")
        : "";
    }
    case "list": {
      const items = block.items.map((item) => item.trim()).filter(Boolean);
      return items
        .map((item, index) => {
          const lines = item.replace(/\s*\n\s*/g, " ");
          return block.ordered ? `${index + 1}. ${lines}` : `- ${lines}`;
        })
        .join("\n");
    }
    case "callout": {
      const text = block.text.trim();
      if (!text) return "";
      const info = [
        "callout",
        `type=${block.kind}`,
        block.title.trim() ? attribute("title", block.title.trim()) : "",
      ]
        .filter(Boolean)
        .join(" ");
      return fence(info, text);
    }
    case "divider":
      return "---";
    case "image": {
      if (!block.src.trim()) return "";
      const flags = [
        block.wide ? "wide" : "",
        block.decorative ? "decorative" : "",
      ]
        .filter(Boolean)
        .join("&");
      const address = `${block.src.trim().replace(/#.*$/, "").replace(/ /g, "%20")}${flags ? `#${flags}` : ""}`;
      const caption = block.caption.trim().replace(/"/g, '\\"');
      const alt = block.decorative
        ? ""
        : block.alt.trim().replace(/[[\]]/g, "");
      return `![${alt}](${address}${caption ? ` "${caption}"` : ""})`;
    }
    case "code": {
      if (!block.code.trim()) return "";
      const info = [
        block.lang.trim(),
        block.file.trim() ? attribute("title", block.file.trim()) : "",
        block.lineNumbers ? "showLineNumbers" : "",
        block.highlight.trim() ? `{${block.highlight.trim()}}` : "",
      ]
        .filter(Boolean)
        .join(" ");
      return fence(info, block.code.replace(/\n+$/, ""));
    }
    case "session": {
      if (!block.sessionId) return "";
      const info = [
        "session",
        `id=${block.sessionId}`,
        block.from != null ? `from=${block.from}` : "",
        block.to != null ? `to=${block.to}` : "",
        block.title.trim() ? attribute("title", block.title.trim()) : "",
      ]
        .filter(Boolean)
        .join(" ");
      return `\`\`\`${info}\n\`\`\``;
    }
    case "raw":
      return block.markdown.trim();
    default: {
      const written = customText(block);
      return written?.body
        ? fence(
            written.meta ? `${block.type} ${written.meta}` : block.type,
            written.body,
          )
        : "";
    }
  }
}

// What a form block writes inside its fence: the attributes and the body.
function customText(block: EditorBlock): { meta: string; body: string } | null {
  switch (block.type) {
    case "steps":
      return { meta: "", body: stepsText(block.data) };
    case "compare":
      return { meta: "", body: compareText(block.data) };
    case "filetree":
      return { meta: "", body: fileTreeText(block.data) };
    case "typewriter":
      return {
        meta: typewriterMeta(block.data),
        body: typewriterText(block.data),
      };
    case "codegroup":
      return { meta: "", body: codeGroupText(block.data) };
    case "diff":
      return { meta: diffMeta(block.data), body: diffText(block.data) };
    case "terminal":
      return { meta: terminalMeta(block.data), body: terminalText(block.data) };
    case "quiz":
      return { meta: "", body: quizText(block.data) };
    case "flow":
      return { meta: "", body: flowText(block.data) };
    default:
      return null;
  }
}

// Blocks are separated by a blank line; empty ones write nothing.
export const blocksToMarkdown = (blocks: readonly EditorBlock[]): string => {
  const parts = blocks.map(blockToMarkdown).filter((part) => part !== "");
  return parts.length ? `${parts.join("\n\n")}\n` : "";
};

// ---- markdown → blocks -----------------------------------------------------------

const reader = unified().use(remarkParse).use(remarkGfm);

type Positioned = {
  position?: { start: { offset?: number }; end: { offset?: number } };
};

function slice(source: string, node: Positioned): string {
  const start = node.position?.start.offset ?? 0;
  const end = node.position?.end.offset ?? source.length;
  return source.slice(start, end);
}

function readImage(source: string, node: Paragraph): EditorBlock | null {
  const meaningful = node.children.filter(
    (child) => !(child.type === "text" && child.value.trim() === ""),
  );
  if (meaningful.length !== 1 || meaningful[0].type !== "image") return null;
  const image = meaningful[0] as Image;
  const [address, ...flags] = image.url.split("#");
  const options = flags.join("#").split("&");
  const caption = image.title ?? "";
  void source;
  return {
    id: "",
    type: "image",
    src: address.replace(/%20/g, " "),
    alt: image.alt ?? "",
    decorative: options.includes("decorative"),
    caption,
    wide: options.includes("wide"),
  };
}

function readList(source: string, node: List): EditorBlock | null {
  if (node.ordered && node.start != null && node.start !== 1) return null;
  const items: string[] = [];
  for (const item of node.children as ListItem[]) {
    if (item.spread || item.checked != null || item.children.length !== 1)
      return null;
    const [only] = item.children;
    if (only.type !== "paragraph") return null;
    items.push(slice(source, only));
  }
  return { id: "", type: "list", ordered: !!node.ordered, items };
}

// A steps, quiz… block, when the form writes it back so that it reads the same
// (and it has no attributes the form doesn't know), else it stays raw.
function readCustom(node: Code, name: BlockName): EditorBlock | null {
  const parsed = parseBlock(name, node.value, node.meta ?? null);
  if (!parsed.ok) return null;
  const { values, flags, highlight } = parseFenceMeta(node.meta);
  const known =
    name === "typewriter" || name === "diff"
      ? ["lang", "title"]
      : name === "terminal"
        ? ["title"]
        : [];
  if (
    flags.size ||
    highlight.size ||
    Object.keys(values).some((k) => !known.includes(k))
  )
    return null;

  const block = { id: "", type: name, data: parsed.data } as EditorBlock;
  const written = customText(block);
  if (!written) return null;
  const again = parseBlock(name, written.body, written.meta || null);
  if (!again.ok || JSON.stringify(again.data) !== JSON.stringify(parsed.data))
    return null;
  return block;
}

// A session block, when its attributes are the ones the form writes.
function readSession(node: Code): EditorBlock | null {
  const { values, flags, highlight } = parseFenceMeta(node.meta);
  if (node.value.trim() || flags.size || highlight.size) return null;
  if (
    Object.keys(values).some((k) => !["id", "from", "to", "title"].includes(k))
  )
    return null;
  const turn = (value: string | undefined) =>
    value === undefined
      ? null
      : /^[1-9]\d{0,3}$/.test(value)
        ? Number(value)
        : NaN;
  const from = turn(values.from);
  const to = turn(values.to);
  if (
    !/^[0-9a-f]{6,16}$/.test(values.id ?? "") ||
    Number.isNaN(from) ||
    Number.isNaN(to)
  )
    return null;
  return {
    id: "",
    type: "session",
    sessionId: values.id,
    from,
    to,
    title: values.title ?? "",
  };
}

function readCode(source: string, node: Code): EditorBlock | null {
  const raw = slice(source, node);
  if (!raw.startsWith("```")) return null;
  const lang = node.lang ?? "";
  const { values, flags, highlight } = parseFenceMeta(node.meta);

  if (lang === "callout") {
    const extra = Object.keys(values).filter(
      (k) => k !== "type" && k !== "title",
    );
    if (extra.length || flags.size || highlight.size) return null;
    const kind = values.type;
    return {
      id: "",
      type: "callout",
      kind: kind === "tip" || kind === "warning" ? kind : "note",
      title: values.title ?? "",
      text: node.value,
    };
  }
  if (lang === "session") return readSession(node);
  if (isBlockName(lang)) return readCustom(node, lang);

  // Only what the Code form can write: a title, line numbers, highlighted lines.
  const extra = Object.keys(values).filter((k) => k !== "title");
  const unknownFlags = [...flags].filter((flag) => flag !== "showLineNumbers");
  const braces = [...(node.meta ?? "").matchAll(/\{([\d,\-\s]+)\}/g)];
  if (extra.length || unknownFlags.length || braces.length > 1) return null;
  return {
    id: "",
    type: "code",
    lang,
    file: values.title ?? "",
    code: node.value,
    highlight: braces[0]?.[1].trim() ?? "",
    lineNumbers: flags.has("showLineNumbers"),
  };
}

export function markdownToBlocks(
  markdown: string,
  makeId: () => string = newBlockId,
): EditorBlock[] {
  const source = markdown.replace(/\r\n?/g, "\n");
  const tree = reader.parse(source) as Root;
  const blocks: EditorBlock[] = [];

  for (const node of tree.children) {
    const raw = slice(source, node);
    let block: EditorBlock | null = null;

    switch (node.type) {
      case "paragraph":
        block = readImage(source, node) ?? {
          id: "",
          type: "paragraph",
          text: raw,
        };
        break;
      case "heading": {
        const hashes = raw.match(/^(#{2,4})[ \t]+(.*?)[ \t#]*$/);
        if (hashes && node.depth === hashes[1].length) {
          block = {
            id: "",
            type: "heading",
            level: node.depth as 2 | 3 | 4,
            text: hashes[2],
          };
        }
        break;
      }
      case "blockquote":
        block = {
          id: "",
          type: "quote",
          text: raw
            .split("\n")
            .map((line) => line.replace(/^ {0,3}> ?/, ""))
            .join("\n"),
        };
        break;
      case "list":
        block = readList(source, node);
        break;
      case "code":
        block = readCode(source, node);
        break;
      case "thematicBreak":
        block = { id: "", type: "divider" };
        break;
    }

    blocks.push({
      ...(block ?? { type: "raw", markdown: raw }),
      id: makeId(),
    } as EditorBlock);
  }
  return blocks;
}

// ---- checks ----------------------------------------------------------------------

export type BlockProblem = { blockId: string; message: string };

// What stops a post from being published (design.md §13.48: each block is
// checked as you go; Publish waits until every block is valid).
export function blockProblems(blocks: readonly EditorBlock[]): BlockProblem[] {
  const problems: BlockProblem[] = [];
  const add = (block: EditorBlock, message: string) =>
    problems.push({ blockId: block.id, message });

  for (const block of blocks) {
    switch (block.type) {
      case "heading":
        if (!block.text.trim()) add(block, "Add the heading text.");
        break;
      case "image":
        if (!block.src.trim()) add(block, "Add an image.");
        else if (!block.decorative && !block.alt.trim())
          add(block, "Add alt text, or mark the image as decorative.");
        break;
      case "code":
        if (!block.code.trim()) add(block, "Add the code.");
        else if (
          block.highlight.trim() &&
          !/^[\d,\-\s]+$/.test(block.highlight)
        )
          add(block, "Highlighted lines look like 2, 4-6.");
        break;
      case "callout":
        if (!block.text.trim()) add(block, "Add the callout text.");
        break;
      case "quote":
        if (!block.text.trim()) add(block, "Add the quote text.");
        break;
      case "list":
        if (!block.items.some((item) => item.trim()))
          add(block, "Add at least one item.");
        break;
      case "session":
        if (
          block.sessionId &&
          block.from != null &&
          block.to != null &&
          block.from > block.to
        )
          add(block, "The first turn can't come after the last one.");
        break;
      case "raw": {
        const found = rawProblem(block.markdown);
        if (found) add(block, found);
        break;
      }
      default: {
        const found = customProblem(block);
        if (found) add(block, found);
      }
    }
  }
  return problems;
}

// What is wrong with a form block, in the words of its form. A block with
// nothing filled in writes nothing and is not a problem.
function customProblem(block: EditorBlock): string | null {
  const written = customText(block);
  if (!written || !written.body) return null;
  switch (block.type) {
    case "steps":
      if (block.data.some((step) => !step.title.trim()))
        return "Give every step a title.";
      break;
    case "compare":
      if (block.data.header.some((text) => !text.trim()))
        return "Fill in every column heading.";
      if (block.data.rows.length === 0) return "Add at least one row.";
      break;
    case "filetree":
      break;
    case "flow":
      break;
    case "typewriter":
      if (!block.data.lang.trim()) return "Choose the language.";
      break;
    case "codegroup":
      if (block.data.some((tab) => !tab.lang.trim()))
        return "Choose a language for every tab.";
      if (block.data.some((tab) => !tab.code.trim()))
        return "Every tab needs code.";
      break;
    case "diff":
      if (!block.data.lines.some((line) => line.type !== "same"))
        return "Change something between Before and After to show a diff.";
      break;
    case "terminal":
      if (!block.data.rows.some((row) => row.type === "command"))
        return "Add at least one command.";
      break;
    case "quiz":
      for (const question of block.data) {
        const label = question.question.trim() || "A question";
        if (!question.question.trim()) return "Every question needs its text.";
        if (question.options.some((option) => !option.text.trim()))
          return `${label}: fill in every option, or remove the empty ones.`;
        if (question.options.length < 2 || question.options.length > 4)
          return `${label}: use 2 to 4 options.`;
        if (question.options.filter((option) => option.correct).length !== 1)
          return `${label}: mark exactly one right answer.`;
      }
      break;
  }
  const parsed = parseBlock(
    block.type as BlockName,
    written.body,
    written.meta || null,
  );
  return parsed.ok ? null : parsed.error;
}

// A raw block holding a custom block that can't be read says why.
function rawProblem(markdown: string): string | null {
  if (!markdown.trim()) return null;
  const tree = reader.parse(markdown) as Root;
  for (const node of tree.children) {
    if (node.type !== "code" || !isBlockName(node.lang)) continue;
    const parsed = parseBlock(node.lang, node.value, node.meta ?? null);
    if (!parsed.ok)
      return `The ${node.lang} block can't be read: ${parsed.error}`;
  }
  return null;
}

// What kind of custom block a raw block holds, for its tag.
export function rawKind(markdown: string): string | null {
  const match = markdown.match(/^`{3,}(\w+)/);
  return match ? match[1] : null;
}
