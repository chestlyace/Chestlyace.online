import { describe, expect, it } from "vitest";
import {
  parseCodeGroup,
  parseCompare,
  parseDiff,
  parseFileTree,
  parseFlow,
  parseQuiz,
  parseSessionBlock,
  parseSteps,
  parseTerminal,
  parseTypewriter,
} from "./blocks";

const data = <T>(result: { ok: boolean; data?: T; error?: string }) => {
  if (!result.ok) throw new Error(result.error);
  return result.data as T;
};

describe("parseSteps", () => {
  it("reads titles, icons and text", () => {
    const steps = data(
      parseSteps(
        "## Two accounts\nicon: user-group\nSet up a second directory.\nMore.\n---\n## The decision\nOne command.",
      ),
    );
    expect(steps).toEqual([
      {
        title: "Two accounts",
        icon: "user-group",
        text: "Set up a second directory.\nMore.",
      },
      { title: "The decision", icon: null, text: "One command." },
    ]);
  });

  it("refuses a step without a title or an empty block", () => {
    expect(parseSteps("Just text").ok).toBe(false);
    expect(parseSteps("  \n").ok).toBe(false);
  });
});

describe("parseCompare", () => {
  it("reads the title, the recommended column and the table", () => {
    const compare = data(
      parseCompare(
        "title: A vs B\nhighlight: 2\n| Aspect | A | B |\n|---|---|---|\n| Speed | slow | fast |\n| Cost | high | low |",
      ),
    );
    expect(compare.title).toBe("A vs B");
    expect(compare.highlight).toBe(1);
    expect(compare.header).toEqual(["Aspect", "A", "B"]);
    expect(compare.rows).toEqual([
      ["Speed", "slow", "fast"],
      ["Cost", "high", "low"],
    ]);
  });

  it("pads short rows, keeps escaped pipes, ignores a bad highlight", () => {
    const compare = data(parseCompare("highlight: 9\n| a | b |\n| x \\| y |"));
    expect(compare.highlight).toBeNull();
    expect(compare.rows).toEqual([["x | y", ""]]);
  });

  it("refuses text that is not a table", () => {
    expect(parseCompare("hello").ok).toBe(false);
    expect(parseCompare("title: only").ok).toBe(false);
  });
});

describe("parseFileTree", () => {
  it("reads a drawn tree with notes and highlights", () => {
    const tree = data(
      parseFileTree(
        "~/\n├── .claude-acme/  # The Acme account\n└── Projects/\n    └── + AcmeCorp/  # Everything here\n        └── app.ts",
      ),
    );
    expect(tree.map((e) => [e.name, e.depth, e.folder])).toEqual([
      ["~/", 0, true],
      [".claude-acme/", 1, true],
      ["Projects/", 1, true],
      ["AcmeCorp/", 2, true],
      ["app.ts", 3, false],
    ]);
    expect(tree[1].note).toBe("The Acme account");
    expect(tree[3].highlight).toBe(true);
  });

  it("reads an indented tree", () => {
    const tree = data(parseFileTree("src/\n  app/\n    page.tsx\n  lib/"));
    expect(tree.map((e) => e.depth)).toEqual([0, 1, 2, 1]);
  });

  it("refuses an empty tree", () => {
    expect(parseFileTree("\n").ok).toBe(false);
  });
});

describe("parseTypewriter", () => {
  it("reads the language, the file name, and captions", () => {
    const t = data(
      parseTypewriter(
        'claude() {   // @ Same name as the binary\n  case "$PWD" in\n}',
        'lang=bash title=".zshrc"',
      ),
    );
    expect(t.lang).toBe("bash");
    expect(t.title).toBe(".zshrc");
    expect(t.lines).toEqual([
      { code: "claude() {", caption: "Same name as the binary" },
      { code: '  case "$PWD" in', caption: null },
      { code: "}", caption: null },
    ]);
  });

  it("falls back to plain text and refuses no code", () => {
    expect(data(parseTypewriter("a", null)).lang).toBe("text");
    expect(parseTypewriter("  ", null).ok).toBe(false);
  });
});

describe("parseCodeGroup", () => {
  it("splits tabs on their header lines", () => {
    const tabs = data(
      parseCodeGroup("--- bash wrapper.sh\n#!/bin/bash\nexec x\n--- json\n{ }"),
    );
    expect(tabs).toEqual([
      { lang: "bash", file: "wrapper.sh", code: "#!/bin/bash\nexec x" },
      { lang: "json", file: null, code: "{ }" },
    ]);
  });

  it("refuses text before the first tab and an empty group", () => {
    expect(parseCodeGroup("stray\n--- ts\nx").ok).toBe(false);
    expect(parseCodeGroup("").ok).toBe(false);
  });
});

describe("parseDiff", () => {
  it("marks added, removed and unchanged lines", () => {
    const diff = data(
      parseDiff("- old\n+ new\n    same\n+  indented", "lang=ts"),
    );
    expect(diff.lines).toEqual([
      { type: "remove", text: "old" },
      { type: "add", text: "new" },
      { type: "same", text: "  same" },
      { type: "add", text: " indented" },
    ]);
    expect(diff.lang).toBe("ts");
  });
});

describe("parseTerminal", () => {
  it("tells commands, output and comments apart", () => {
    const t = data(
      parseTerminal("$ cd ~/Projects\n# a note\nACME\n$ ls\n", 'title="zsh"'),
    );
    expect(t.title).toBe("zsh");
    expect(t.rows).toEqual([
      { type: "command", text: "cd ~/Projects" },
      { type: "comment", text: "a note" },
      { type: "output", text: "ACME" },
      { type: "command", text: "ls" },
    ]);
  });

  it("needs a command", () => {
    expect(parseTerminal("just output", null).ok).toBe(false);
  });
});

describe("parseFlow", () => {
  const source = [
    "[org|icon:cloud|style:teal|desc:The company|pos:240,0] Organization",
    "[proj|group|dir:v|style:green] production",
    "[api|icon:server|style:orange|parent:proj] api",
    "org --> api : contains",
  ].join("\n");

  it("reads boxes, groups and arrows", () => {
    const flow = data(parseFlow(source));
    expect(flow.nodes[0]).toMatchObject({
      id: "org",
      label: "Organization",
      icon: "cloud",
      style: "teal",
      desc: "The company",
      pos: { x: 240, y: 0 },
      group: false,
    });
    expect(flow.nodes[1]).toMatchObject({ group: true, dir: "v" });
    expect(flow.nodes[2].parent).toBe("proj");
    expect(flow.edges).toEqual([{ from: "org", to: "api", label: "contains" }]);
  });

  it.each([
    ["an unknown colour", "[a|style:pink] A"],
    ["a bad position", "[a|pos:x] A"],
    ["a repeated id", "[a] A\n[a] B"],
    ["an arrow to nowhere", "[a] A\na --> b"],
    ["a parent that is not a group", "[a] A\n[b|parent:a] B"],
    ["a line that is neither", "[a] A\nhello"],
    ["no boxes", "a --> b"],
  ])("refuses %s", (_, text) => {
    expect(parseFlow(text).ok).toBe(false);
  });
});

describe("parseQuiz", () => {
  it("reads questions, options and explanations", () => {
    const quiz = data(
      parseQuiz(
        "Q: Which one?\n) A\n*) B\n) C\nE: Because B.\nIt is B.\n---\nQ: Next?\n*) yes\n) no",
      ),
    );
    expect(quiz).toHaveLength(2);
    expect(quiz[0].options.map((o) => o.correct)).toEqual([false, true, false]);
    expect(quiz[0].explanation).toBe("Because B. It is B.");
    expect(quiz[1].explanation).toBeNull();
  });

  it("needs a question, two options and exactly one right answer", () => {
    expect(parseQuiz(") a\n*) b").ok).toBe(false);
    expect(parseQuiz("Q: x\n*) a").ok).toBe(false);
    expect(parseQuiz("Q: x\n) a\n) b").ok).toBe(false);
    expect(parseQuiz("Q: x\n*) a\n*) b").ok).toBe(false);
  });
});

describe("parseSessionBlock", () => {
  it("reads the id, the range and the title", () => {
    expect(
      data(
        parseSessionBlock(
          'id=4f9c1a from=3 to=18 title="Refactoring the proxy"',
        ),
      ),
    ).toEqual({
      id: "4f9c1a",
      from: 3,
      to: 18,
      title: "Refactoring the proxy",
    });
    expect(data(parseSessionBlock("id=4f9c1a8e"))).toEqual({
      id: "4f9c1a8e",
      from: null,
      to: null,
      title: null,
    });
  });

  it("says what is wrong", () => {
    expect(parseSessionBlock(null)).toMatchObject({ ok: false });
    expect(parseSessionBlock("id=zzz")).toMatchObject({ ok: false });
    expect(parseSessionBlock("id=4f9c1a from=0")).toMatchObject({ ok: false });
    expect(parseSessionBlock("id=4f9c1a from=x")).toMatchObject({ ok: false });
    expect(parseSessionBlock("id=4f9c1a from=5 to=2")).toMatchObject({
      ok: false,
      error: "The first turn can't come after the last one.",
    });
  });
});
