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
    const steps = "```session id=1 from=1 to=2\n```";
    const table = "| a | b |\n| - | - |\n| 1 | 2 |";
    expect(types(`${steps}\n\n${table}`)).toEqual(["raw", "raw"]);
    expect(read(steps)[0]).toMatchObject({ markdown: steps });
    expect(rawKind(steps)).toBe("session");
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

// ---- the interactive blocks have forms ------------------------------------------------

const EXAMPLES: Record<string, string> = {
  steps:
    "```steps\n## Two accounts\nicon: users\nSet up a **second** config.\n---\n## The wrong account\nicon: triangle-alert\nOpened the wrong project.\n```",
  compare:
    "```compare\ntitle: Aliases vs routing\nhighlight: 3\n| Aspect | Aliases | Routing |\n| Commands | Two | Just `claude` |\n| Overhead | Constant | None |\n```",
  filetree:
    "```filetree\napp/\n  sites/  # The sites\n    blog/\n  + proxy.ts  # Picks the site\n  globals.css\n```",
  typewriter:
    '```typewriter lang=ts title="a.ts"\nconst a = 1;  // @ A constant\nconsole.log(a);\n```',
  codegroup:
    '```codegroup\n--- bash wrapper.sh\n#!/bin/bash\necho hi\n--- json settings.json\n{ "a": 1 }\n```',
  diff: '```diff lang=bash title="w.sh"\n- old\n+ new\n  same\n```',
  terminal:
    '```terminal title="zsh"\n# a comment\n$ cd ~/Projects\n$ echo $X\n/Users/alex/.claude\n```',
  flow: "```flow\n[org|icon:cloud|style:teal|desc:The company|pos:240,0] Organization\n[proj|group|dir:v|pos:20,200] production\n[api|parent:proj] api\n\norg --> api : contains\n```",
  quiz: "```quiz\nQ: Which variable?\n) A flag\n*) CLAUDE_CONFIG_DIR\n) The last login\nE: It points the tool at a config directory.\n---\nQ: Two?\n*) Yes\n) No\n```",
};

describe("interactive blocks", () => {
  for (const [name, markdown] of Object.entries(EXAMPLES)) {
    it(`reads ${name} into its form and writes it back so it reads the same`, () => {
      const [block] = read(markdown);
      expect(block.type).toBe(name);
      const written = blocksToMarkdown([block]);
      const [again] = read(written);
      expect(again.type).toBe(name);
      expect("data" in again && again.data).toEqual(
        "data" in block && block.data,
      );
      // writing is stable
      expect(blocksToMarkdown([again])).toBe(written);
    });
  }

  it("keeps a block raw when its form would lose something", () => {
    expect(types("```steps\n## One\nunknown: x\n---\n## Two\n```")).toEqual([
      "steps",
    ]);
    expect(types("```typewriter lang=ts foo=bar\nx\n```")).toEqual(["raw"]);
    expect(types("```terminal\nno command here\n```")).toEqual(["raw"]);
    expect(types("```steps\nnot a step\n```")).toEqual(["raw"]);
    expect(types("```flow\n[a] A\n[b|style:mauve] B\n```")).toEqual(["raw"]);
    expect(types("```flow\n[a] A\nb --> a\n```")).toEqual(["raw"]);
  });

  it("writes nothing for an empty block and guards a --- line in step text", () => {
    expect(
      blocksToMarkdown([
        emptyBlock("steps", "1"),
        emptyBlock("quiz", "2"),
        emptyBlock("diff", "3"),
      ]),
    ).toBe("");
    const [steps] = read(EXAMPLES.steps);
    if (steps.type !== "steps") throw new Error("not steps");
    steps.data[0].text = "Before\n---\nAfter";
    const [again] = read(blocksToMarkdown([steps]));
    expect(again.type).toBe("steps");
    expect(again.type === "steps" && again.data).toHaveLength(2);
  });

  it("says what is wrong with a block in the words of its form", () => {
    const check = (
      type: EditorBlock["type"],
      change: (b: EditorBlock) => void,
    ) => {
      const block = emptyBlock(type, type);
      change(block);
      return blockProblems([block]).map((p) => p.message)[0];
    };
    expect(
      check("steps", (b) => b.type === "steps" && (b.data[0].text = "x")),
    ).toMatch(/title/);
    expect(
      check("quiz", (b) => {
        if (b.type !== "quiz") return;
        b.data[0].question = "Q?";
        b.data[0].options = [
          { text: "a", correct: false },
          { text: "b", correct: false },
        ];
      }),
    ).toMatch(/exactly one right answer/);
    expect(
      check(
        "terminal",
        (b) =>
          b.type === "terminal" &&
          (b.data.rows = [{ type: "output", text: "hi" }]),
      ),
    ).toMatch(/command/);
    expect(
      check(
        "diff",
        (b) =>
          b.type === "diff" && (b.data.lines = [{ type: "same", text: "x" }]),
      ),
    ).toMatch(/diff/i);
    expect(
      check(
        "codegroup",
        (b) => b.type === "codegroup" && (b.data[0].code = "x"),
      ),
    ).toMatch(/needs code/);
    expect(blockProblems([emptyBlock("quiz", "q")])).toEqual([]);
  });
});
