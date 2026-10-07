import { describe, expect, it } from "vitest";
import {
  blockProblems,
  blocksToMarkdown,
  emptyBlock,
  markdownToBlocks,
  rawKind,
  type EditorBlock,
} from "./editor";

let n = 0;
const read = (markdown: string) => markdownToBlocks(markdown, () => `b${++n}`);
const types = (markdown: string) => read(markdown).map((block) => block.type);

describe("markdownToBlocks", () => {
  it("reads each kind of block the editor has a form for", () => {
    const blocks = read(
      [
        "Some **bold** text.",
        "### A heading",
        "> quoted\n> lines",
        "- one\n- two",
        "1. first\n2. second",
        '```callout type=tip title="Heads up"\nBody\n```',
        "---",
        '![A dog](https://x.test/dog.webp#wide "Good dog")',
        '```ts title="a.ts" showLineNumbers {2,4-5}\nconst a = 1;\n```',
      ].join("\n\n"),
    );
    expect(blocks.map((b) => b.type)).toEqual([
      "paragraph",
      "heading",
      "quote",
      "list",
      "list",
      "callout",
      "divider",
      "image",
      "code",
    ]);
    expect(blocks[2]).toMatchObject({ text: "quoted\nlines" });
    expect(blocks[3]).toMatchObject({ ordered: false, items: ["one", "two"] });
    expect(blocks[4]).toMatchObject({
      ordered: true,
      items: ["first", "second"],
    });
    expect(blocks[5]).toMatchObject({
      kind: "tip",
      title: "Heads up",
      text: "Body",
    });
    expect(blocks[7]).toMatchObject({
      src: "https://x.test/dog.webp",
      alt: "A dog",
      wide: true,
      decorative: false,
      caption: "Good dog",
    });
    expect(blocks[8]).toMatchObject({
      lang: "ts",
      file: "a.ts",
      lineNumbers: true,
      highlight: "2,4-5",
      code: "const a = 1;",
    });
  });

  it("marks a decorative image", () => {
    expect(read("![](https://x.test/a.webp#decorative)")[0]).toMatchObject({
      type: "image",
      decorative: true,
      alt: "",
    });
  });

  it("keeps what has no form yet as raw blocks, untouched", () => {
    const steps = "```steps\n## One\n---\n## Two\n```";
    const table = "| a | b |\n| - | - |\n| 1 | 2 |";
    expect(types(`${steps}\n\n${table}`)).toEqual(["raw", "raw"]);
    expect(read(steps)[0]).toMatchObject({ markdown: steps });
    expect(rawKind(steps)).toBe("steps");
    // a code fence with options the Code form can't write also stays raw
    expect(types("```ts foo=bar\nx\n```")).toEqual(["raw"]);
    // nested lists, a level-1 heading and indented code too
    expect(types("- a\n  - b")).toEqual(["raw"]);
    expect(types("# Title")).toEqual(["raw"]);
    expect(types("    indented")).toEqual(["raw"]);
  });
});

describe("blocksToMarkdown", () => {
  it("writes blocks separated by blank lines and skips empty ones", () => {
    const md = blocksToMarkdown([
      { ...emptyBlock("heading", "1"), text: "Hello" } as EditorBlock,
      emptyBlock("paragraph", "2"),
      { ...emptyBlock("paragraph", "3"), text: " Body " } as EditorBlock,
    ]);
    expect(md).toBe("## Hello\n\nBody\n");
  });

  it("uses a longer fence when the code contains one", () => {
    const md = blocksToMarkdown([
      {
        ...emptyBlock("code", "1"),
        lang: "md",
        code: "```ts\nx\n```",
      } as EditorBlock,
    ]);
    expect(md.startsWith("````md\n")).toBe(true);
    expect(read(md)[0]).toMatchObject({ type: "code", code: "```ts\nx\n```" });
  });

  it("writes an image's marks and drops alt text for a decorative one", () => {
    const image = (over: object) =>
      blocksToMarkdown([
        {
          ...emptyBlock("image", "1"),
          src: "https://x.test/a b.webp",
          ...over,
        } as EditorBlock,
      ]);
    expect(image({ alt: "Alt", wide: true, caption: 'A "cap"' })).toBe(
      '![Alt](https://x.test/a%20b.webp#wide "A \\"cap\\"")\n',
    );
    expect(image({ alt: "ignored", decorative: true })).toBe(
      "![](https://x.test/a%20b.webp#decorative)\n",
    );
  });

  it("round-trips: reading what was written gives the same blocks and text", () => {
    const source = [
      "Intro with a [link](https://x.test) and `code`.",
      "## First",
      "> A quote",
      "1. one\n2. two",
      '```callout type=warning title="Careful"\nDon\'t.\n```',
      "---",
      "```steps\n## A\n---\n## B\n```",
      '```bash title="run.sh"\necho hi\n```',
      "| a | b |\n| - | - |\n| 1 | 2 |",
      "![Alt](https://x.test/a.webp)",
    ].join("\n\n");
    const once = blocksToMarkdown(read(source));
    const twice = blocksToMarkdown(read(once));
    expect(twice).toBe(once);
    expect(read(once).map((b) => b.type)).toEqual(
      read(source).map((b) => b.type),
    );
    expect(once).toContain("```steps\n## A\n---\n## B\n```");
  });
});

describe("blockProblems", () => {
  it("flags what would stop a post being published", () => {
    const blocks = [
      { ...emptyBlock("heading", "h") } as EditorBlock,
      {
        ...emptyBlock("image", "i"),
        src: "https://x.test/a.webp",
      } as EditorBlock,
      {
        ...emptyBlock("image", "i2"),
        src: "https://x.test/a.webp",
        decorative: true,
      } as EditorBlock,
      {
        ...emptyBlock("code", "c"),
        code: "x",
        highlight: "two",
      } as EditorBlock,
      {
        ...emptyBlock("raw", "r"),
        markdown: "```quiz\nQ: One?\n) no\n) nope\n```",
      } as EditorBlock,
      { ...emptyBlock("paragraph", "p") } as EditorBlock,
    ];
    const problems = blockProblems(blocks);
    expect(problems.map((p) => p.blockId)).toEqual(["h", "i", "c", "r"]);
    expect(problems[3].message).toContain("quiz");
  });
});
