import type { TerminalRow, TypewriterLine } from "./blocks";

// The timelines of the two typing blocks (design.md §13.41, §13.44), as pure
// functions of the time elapsed, so a replay, a skip and a pause are all just a
// different number.

export const TYPEWRITER_CHAR_MS = 18;
export const TYPEWRITER_LINE_MS = 120;

export type TypewriterState = {
  /** Lines finished typing (their captions show). */
  doneLines: number;
  /** The line being typed, and how many of its characters are showing. */
  typing: { line: number; chars: number } | null;
  done: boolean;
};

export function typewriterState(
  lines: readonly TypewriterLine[],
  elapsed: number,
): TypewriterState {
  let clock = 0;
  for (let i = 0; i < lines.length; i++) {
    const typeTime = lines[i].code.length * TYPEWRITER_CHAR_MS;
    if (elapsed < clock + typeTime) {
      return {
        doneLines: i,
        typing: {
          line: i,
          chars: Math.floor((elapsed - clock) / TYPEWRITER_CHAR_MS),
        },
        done: false,
      };
    }
    clock += typeTime;
    if (elapsed < clock + TYPEWRITER_LINE_MS) {
      return { doneLines: i + 1, typing: null, done: false };
    }
    clock += TYPEWRITER_LINE_MS;
  }
  return { doneLines: lines.length, typing: null, done: true };
}

export const totalTypewriterMs = (lines: readonly TypewriterLine[]) =>
  lines.reduce(
    (sum, line) =>
      sum + line.code.length * TYPEWRITER_CHAR_MS + TYPEWRITER_LINE_MS,
    0,
  );

export const TERMINAL_CHAR_MS = 22;
const AFTER_COMMAND_MS = 120;
const OUTPUT_LINE_MS = 40;
const BETWEEN_COMMANDS_MS = 400;

export type TerminalState = {
  /** Rows shown in full (earlier rows, finished commands, printed output). */
  shown: number;
  /** The command being typed, and its visible characters. */
  typing: { row: number; chars: number } | null;
  done: boolean;
};

export function terminalState(
  rows: readonly TerminalRow[],
  elapsed: number,
): TerminalState {
  let clock = 0;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (row.type === "command") {
      const typeTime = row.text.length * TERMINAL_CHAR_MS;
      if (elapsed < clock + typeTime) {
        return {
          shown: i,
          typing: {
            row: i,
            chars: Math.floor((elapsed - clock) / TERMINAL_CHAR_MS),
          },
          done: false,
        };
      }
      clock += typeTime;
      const next = rows[i + 1];
      const pause =
        next && next.type !== "command"
          ? AFTER_COMMAND_MS
          : BETWEEN_COMMANDS_MS;
      if (elapsed < clock + pause)
        return { shown: i + 1, typing: null, done: false };
      clock += pause;
    } else {
      if (elapsed < clock + OUTPUT_LINE_MS)
        return { shown: i, typing: null, done: false };
      clock += OUTPUT_LINE_MS;
      const next = rows[i + 1];
      if (next?.type === "command") {
        if (elapsed < clock + BETWEEN_COMMANDS_MS)
          return { shown: i + 1, typing: null, done: false };
        clock += BETWEEN_COMMANDS_MS;
      }
    }
  }
  return { shown: rows.length, typing: null, done: true };
}

export const totalTerminalMs = (rows: readonly TerminalRow[]) => {
  // Far past the end of the timeline: the state there is "done".
  let ms = 0;
  for (const row of rows)
    ms +=
      row.type === "command"
        ? row.text.length * TERMINAL_CHAR_MS + BETWEEN_COMMANDS_MS
        : OUTPUT_LINE_MS + BETWEEN_COMMANDS_MS;
  return ms + AFTER_COMMAND_MS;
};
