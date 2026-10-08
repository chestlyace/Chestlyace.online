import type { Flow } from "./blocks";
import {
  blockToMarkdown,
  markdownToBlocks,
  rawKind,
  type EditorBlock,
} from "./editor";

// This blog's markdown for DEV (docs/blog-markdown.md §4): DEV only knows standard
// markdown, so each custom block is written as its plain equivalent. Pure.

export const EXPORT_NOTES: Record<string, { name: string; written: string }> = {
  callout: {
    name: "Callout",
    written: "a blockquote starting with its type in bold",
  },
  steps: {
    name: "Steps",
    written:
      "a numbered list of headings (### 1. Title) with the text under each",
  },
  compare: {
    name: "Compare",
    written: "a table, with its title in bold above",
  },
  filetree: {
    name: "File tree",
    written: "a text code block (notes as trailing # comments)",
  },
  typewriter: {
    name: "Typewriter code",
    written: "a normal code block (captions as comments)",
  },
  codegroup: {
    name: "Code group",
    written: "one code block per tab, each under its file name in bold",
  },
  diff: { name: "Diff", written: "a diff code block" },
  terminal: { name: "Terminal", written: "a console code block" },
  flow: {
    name: "Flow canvas",
    written: "a list of its boxes and arrows (no picture yet)",
  },
  quiz: {
    name: "Quiz",
    written: "a Quiz heading with the questions and the right answers marked",
  },
  session: {
    name: "Agent session",
    written: "a short note with a link to the replay on the blog",
  },
};

const HASH = new Set([
  "bash",
  "sh",
  "shell",
  "zsh",
  "python",
  "py",
  "ruby",
  "rb",
  "yaml",
  "yml",
  "toml",
  "dockerfile",
  "ini",
  "powershell",
  "elixir",
  "text",
]);
const DASH = new Set(["sql", "lua"]);

// A comment in the code's own language, for a caption.
export function comment(lang: string, text: string): string {
  const l = lang.toLowerCase();
  if (HASH.has(l)) return `# ${text}`;
  if (DASH.has(l)) return `-- ${text}`;
  if (l === "html" || l === "xml" || l === "svg" || l === "vue")
    return `<!-- ${text} -->`;
  if (l === "css" || l === "scss") return `/* ${text} */`;
  return `// ${text}`;
}

function fence(info: string, body: string) {
  const longest = Math.max(
    0,
    ...[...body.matchAll(/`{3,}/g)].map((run) => run[0].length),
  );
  const ticks = "`".repeat(Math.max(3, longest + 1));
  return `${ticks}${info}\n${body}\n${ticks}`;
}

const cap = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

function flowList(flow: Flow): string {
  const label = (id: string) =>
    flow.nodes.find((n) => n.id === id)?.label ?? id;
  const boxes = flow.nodes.map(
    (n) =>
      `- ${n.label}${n.desc ? `: ${n.desc}` : ""}${n.parent ? ` (inside ${label(n.parent)})` : ""}`,
  );
  const arrows = flow.edges.map(
    (e) =>
      `- ${label(e.from)} → ${label(e.to)}${e.label ? `: ${e.label}` : ""}`,
  );
  return [
    "**Diagram**",
    "",
    "Boxes:",
    "",
    ...boxes,
    ...(arrows.length ? ["", "Arrows:", "", ...arrows] : []),
  ].join("\n");
}

export function blockForDev(block: EditorBlock, postUrl: string): string {
  switch (block.type) {
    case "callout": {
      const head = `**${cap(block.kind)}${block.title.trim() ? `: ${block.title.trim()}` : ""}**`;
      const lines = [head, "", ...block.text.trim().split("\n")];
      return lines.map((line) => (line ? `> ${line}` : ">")).join("\n");
    }
    case "image": {
      const text = blockToMarkdown({
        ...block,
        wide: false,
        decorative: false,
        alt: block.decorative ? "" : block.alt,
      });
      return text;
    }
    case "steps":
      return block.data
        .filter((s) => s.title.trim())
        .map(
          (step, i) =>
            `### ${i + 1}. ${step.title.trim()}${step.text.trim() ? `\n\n${step.text.trim()}` : ""}`,
        )
        .join("\n\n");
    case "compare": {
      const row = (cells: string[]) =>
        `| ${cells.map((c) => c.replace(/\|/g, "\\|").replace(/\n/g, " ")).join(" | ")} |`;
      return [
        block.data.title?.trim() ? `**${block.data.title.trim()}**\n` : "",
        row(block.data.header),
        row(block.data.header.map(() => "---")),
        ...block.data.rows.map(row),
      ]
        .filter((part) => part !== "")
        .join("\n");
    }
    case "filetree":
      return fence(
        "text",
        block.data
          .map(
            (e) =>
              `${"  ".repeat(e.depth)}${e.name}${e.note ? `  # ${e.note}` : ""}`,
          )
          .join("\n"),
      );
    case "typewriter":
      return fence(
        block.data.lang,
        block.data.lines
          .map((line) =>
            line.caption
              ? `${line.code}  ${comment(block.data.lang, line.caption)}`
              : line.code,
          )
          .join("\n"),
      );
    case "codegroup":
      return block.data
        .map(
          (tab) =>
            `${tab.file ? `**${tab.file}**\n\n` : ""}${fence(tab.lang, tab.code)}`,
        )
        .join("\n\n");
    case "diff":
      return fence(
        "diff",
        block.data.lines
          .map((l) =>
            l.type === "add"
              ? `+ ${l.text}`
              : l.type === "remove"
                ? `- ${l.text}`
                : `  ${l.text}`,
          )
          .join("\n"),
      );
    case "terminal":
      return fence(
        "console",
        block.data.rows
          .map((r) =>
            r.type === "command"
              ? `$ ${r.text}`
              : r.type === "comment"
                ? `# ${r.text}`
                : r.text,
          )
          .join("\n"),
      );
    case "flow":
      return flowList(block.data);
    case "quiz":
      return [
        "### Quiz",
        ...block.data.map((q, i) =>
          [
            `**${i + 1}. ${q.question.trim()}**`,
            q.options
              .map((o) => `- ${o.correct ? "✅ " : ""}${o.text.trim()}`)
              .join("\n"),
            q.explanation?.trim() ? `*${q.explanation.trim()}*` : "",
          ]
            .filter(Boolean)
            .join("\n\n"),
        ),
      ].join("\n\n");
    case "session":
      return block.sessionId
        ? `*An agent session is replayed on the blog: [see it here](${postUrl}).*`
        : "";
    case "raw":
      if (rawKind(block.markdown) === "session")
        return `*An agent session is replayed on the blog: [see it here](${postUrl}).*`;
      return block.markdown.trim();
    default:
      return blockToMarkdown(block);
  }
}

// The whole post as DEV markdown, with the closing "Originally published at" line.
export function markdownForDev(markdown: string, postUrl: string): string {
  const body = markdownToBlocks(markdown, () => "x")
    .map((block) => blockForDev(block, postUrl))
    .filter((part) => part.trim() !== "")
    .join("\n\n");
  return `${body}\n\n---\n\n*Originally published at [${postUrl}](${postUrl}).*\n`;
}

/** The custom blocks in a post and how each will be written for DEV, one line per kind. */
export function exportChanges(
  markdown: string,
): { name: string; count: number; written: string }[] {
  const counts = new Map<string, number>();
  for (const block of markdownToBlocks(markdown, () => "x")) {
    const kind = block.type === "raw" ? rawKind(block.markdown) : block.type;
    if (kind && EXPORT_NOTES[kind])
      counts.set(kind, (counts.get(kind) ?? 0) + 1);
  }
  return [...counts].map(([kind, count]) => ({ ...EXPORT_NOTES[kind], count }));
}
