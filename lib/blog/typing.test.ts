import { describe, expect, it } from "vitest";
import {
  TERMINAL_CHAR_MS,
  TYPEWRITER_CHAR_MS,
  TYPEWRITER_LINE_MS,
  terminalState,
  totalTerminalMs,
  totalTypewriterMs,
  typewriterState,
} from "./typing";

const line = (code: string) => ({ code, caption: null });

describe("typewriterState", () => {
  const lines = [line("abcd"), line("ef")];

  it("starts at nothing and types the first line", () => {
    expect(typewriterState(lines, 0)).toEqual({
      doneLines: 0,
      typing: { line: 0, chars: 0 },
      done: false,
    });
    expect(typewriterState(lines, TYPEWRITER_CHAR_MS * 2.5).typing).toEqual({
      line: 0,
      chars: 2,
    });
  });

  it("pauses after a line (its caption shows), then types the next", () => {
    const afterFirst = TYPEWRITER_CHAR_MS * 4 + 10;
    expect(typewriterState(lines, afterFirst)).toEqual({
      doneLines: 1,
      typing: null,
      done: false,
    });
    const second =
      TYPEWRITER_CHAR_MS * 4 + TYPEWRITER_LINE_MS + TYPEWRITER_CHAR_MS;
    expect(typewriterState(lines, second).typing).toEqual({
      line: 1,
      chars: 1,
    });
  });

  it("is done at the total time and stays done", () => {
    expect(typewriterState(lines, totalTypewriterMs(lines)).done).toBe(true);
    expect(typewriterState(lines, 1e9)).toEqual({
      doneLines: 2,
      typing: null,
      done: true,
    });
  });

  it("types a blank line instantly", () => {
    expect(typewriterState([line(""), line("a")], 1).doneLines).toBe(1);
  });
});

describe("terminalState", () => {
  const rows = [
    { type: "command" as const, text: "ls" },
    { type: "output" as const, text: "a" },
    { type: "output" as const, text: "b" },
    { type: "command" as const, text: "x" },
  ];

  it("types a command, then prints its output, then the next command", () => {
    expect(terminalState(rows, 0).typing).toEqual({ row: 0, chars: 0 });
    expect(terminalState(rows, TERMINAL_CHAR_MS * 2 - 1).typing).toEqual({
      row: 0,
      chars: 1,
    });
    const printed = terminalState(rows, TERMINAL_CHAR_MS * 2 + 130 + 41);
    expect(printed.shown).toBe(2);
    expect(printed.typing).toBeNull();
    const later = terminalState(rows, totalTerminalMs(rows) - 200);
    expect(later.shown >= 3).toBe(true);
  });

  it("is done at the end", () => {
    expect(terminalState(rows, totalTerminalMs(rows) + 1)).toEqual({
      shown: 4,
      typing: null,
      done: true,
    });
    expect(terminalState(rows, 1e9).done).toBe(true);
  });
});
