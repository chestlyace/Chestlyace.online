import { describe, expect, it } from "vitest";
import {
  diffFromTexts,
  shiftEntry,
  terminalFromPaste,
  textsFromDiff,
  treeFromPaste,
} from "./editorTools";

describe("diff", () => {
  it("marks removed, added and unchanged lines", () => {
    expect(diffFromTexts("a\nb\nc", "a\nx\nc")).toEqual([
      { type: "same", text: "a" },
      { type: "remove", text: "b" },
      { type: "add", text: "x" },
      { type: "same", text: "c" },
    ]);
    expect(diffFromTexts("", "new")).toEqual([{ type: "add", text: "new" }]);
  });

  it("goes back to the two texts", () => {
    const lines = diffFromTexts("a\nb", "a\nc\nd");
    expect(textsFromDiff(lines)).toEqual({ before: "a\nb", after: "a\nc\nd" });
  });
});

describe("terminalFromPaste", () => {
  it("turns prompts into commands and keeps output and comments", () => {
    expect(
      terminalFromPaste("$ npm i\nadded 3 packages\n# done\n% ls\n"),
    ).toEqual([
      { type: "command", text: "npm i" },
      { type: "output", text: "added 3 packages" },
      { type: "comment", text: "done" },
      { type: "command", text: "ls" },
    ]);
  });
});

describe("file tree", () => {
  it("reads pasted tree output", () => {
    const entries = treeFromPaste(
      "app/\n├── sites/\n│   └── blog/\n└── proxy.ts",
    );
    expect(entries?.map((e) => [e.name, e.depth])).toEqual([
      ["app/", 0],
      ["sites/", 1],
      ["blog/", 2],
      ["proxy.ts", 1],
    ]);
    expect(treeFromPaste("   ")).toBeNull();
  });

  it("indents one level below the row above, never past it, never above the top", () => {
    const base = ["a/", "b", "c"].map((name, i) => ({
      name,
      depth: i === 2 ? 1 : 0,
      folder: name.endsWith("/"),
      note: null,
      highlight: false,
    }));
    expect(shiftEntry(base, 0, 1)[0].depth).toBe(0);
    expect(shiftEntry(base, 1, 1)[1].depth).toBe(1);
    expect(shiftEntry(base, 2, 1)[2].depth).toBe(1);
    expect(shiftEntry(base, 2, -1)[2].depth).toBe(0);
    expect(shiftEntry(base, 1, -1)[1].depth).toBe(0);
  });
});
