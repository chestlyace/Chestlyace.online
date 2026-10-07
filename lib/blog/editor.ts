import type { Code, Image, List, ListItem, Paragraph, Root } from "mdast";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { isBlockName, parseBlock } from "./blocks";
import { parseFenceMeta } from "./meta";

// The block editor's model (design.md §13.48): a post is a list of blocks, each
// filled in with a form, and the markdown of docs/blog-markdown.md is what they
// write and read. Pure (no React, no highlighting), so the editor and its tests
// share it. Blocks without a form yet (steps, quiz…: 9b.3b, 9b.3c) are kept
// intact as `raw` blocks, so a post that has them is never changed by opening it.

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
    case "raw":
      return block.markdown.trim();
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
  if (isBlockName(lang) || lang === "session") return null;

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
      case "raw": {
        const found = rawProblem(block.markdown);
        if (found) add(block, found);
        break;
      }
    }
  }
  return problems;
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
