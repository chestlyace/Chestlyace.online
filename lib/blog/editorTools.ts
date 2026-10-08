import { diffArrays } from "diff";
import {
  parseFileTree,
  type DiffLine,
  type TerminalRow,
  type TreeEntry,
} from "./blocks";

// Small conversions the interactive blocks' forms use (design.md §13.48). Pure.

const split = (text: string) => text.replace(/\r\n?/g, "\n").split("\n");

/** The diff lines between a before and an after text. */
export function diffFromTexts(before: string, after: string): DiffLine[] {
  const a = before === "" ? [] : split(before);
  const b = after === "" ? [] : split(after);
  const lines: DiffLine[] = [];
  for (const part of diffArrays(a, b)) {
    const type = part.added ? "add" : part.removed ? "remove" : "same";
    for (const text of part.value) lines.push({ type, text });
  }
  return lines;
}

/** The before and after texts a diff's lines stand for. */
export function textsFromDiff(lines: readonly DiffLine[]): {
  before: string;
  after: string;
} {
  return {
    before: lines
      .filter((line) => line.type !== "add")
      .map((line) => line.text)
      .join("\n"),
    after: lines
      .filter((line) => line.type !== "remove")
      .map((line) => line.text)
      .join("\n"),
  };
}

/** A pasted terminal session: `$ ` or `% ` lines are commands, the rest output. */
export function terminalFromPaste(text: string): TerminalRow[] {
  return split(text.replace(/\n+$/, "")).map((row) => {
    const prompt = row.match(/^[$%] (.*)$/);
    if (prompt) return { type: "command", text: prompt[1] };
    if (row === "$" || row === "%") return { type: "command", text: "" };
    if (row.startsWith("# ")) return { type: "comment", text: row.slice(2) };
    return { type: "output", text: row };
  });
}

/** Pasted `tree` output (or an indented list) as entries; null if it has none. */
export function treeFromPaste(text: string): TreeEntry[] | null {
  const parsed = parseFileTree(text);
  return parsed.ok ? parsed.data : null;
}

/**
 * Indents or outdents one row: it can go one level in below the row above it
 * (the first row stays at the top) and no further out than the top.
 */
export function shiftEntry(
  entries: readonly TreeEntry[],
  index: number,
  by: 1 | -1,
): TreeEntry[] {
  const above = index > 0 ? entries[index - 1].depth : -1;
  const depth = Math.min(Math.max(0, entries[index].depth + by), above + 1);
  return entries.map((entry, i) => (i === index ? { ...entry, depth } : entry));
}
