import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { findProblems, renderMarkdown } from "./markdown";
import { parseFenceMeta } from "./meta";

const html = async (markdown: string) =>
  renderToStaticMarkup(
    createElement("div", null, (await renderMarkdown(markdown, {})).content),
  );

describe("parseFenceMeta", () => {
  it("reads values, flags and highlighted lines", () => {
    const meta = parseFenceMeta(
      'title="proxy.ts" showLineNumbers {2,4-6} type=tip',
    );
    expect(meta.values).toEqual({ title: "proxy.ts", type: "tip" });
    expect([...meta.flags]).toEqual(["showLineNumbers"]);
    expect([...meta.highlight]).toEqual([2, 4, 5, 6]);
  });

  it("copes with nothing, quotes and nonsense ranges", () => {
    expect(parseFenceMeta(null).values).toEqual({});
    expect(parseFenceMeta("title='a b'").values.title).toBe("a b");
    expect([...parseFenceMeta("{0,x,3-1}").highlight]).toEqual([]);
  });
});

// The first render starts Shiki (loads the grammars and both themes).
describe("renderMarkdown", { timeout: 30_000 }, () => {
  it("gives headings ids and lists h2 and h3 in the contents", async () => {
    const { toc } = await renderMarkdown(
      "## First part\n\ntext\n\n### A detail\n\n#### Not listed\n\n## Second part",
      {},
    );
    expect(toc).toEqual([
      { id: "first-part", text: "First part", depth: 2 },
      { id: "a-detail", text: "A detail", depth: 3 },
      { id: "second-part", text: "Second part", depth: 2 },
    ]);
    expect(await html("## Hello there")).toContain('id="hello-there"');
  });

  it("highlights code for both themes and carries the fence options", async () => {
    const out = await html(
      '```ts title="proxy.ts" showLineNumbers {2}\nconst a = 1;\nconst b = 2;\n```',
    );
    expect(out).toContain('data-title="proxy.ts"');
    expect(out).toContain('data-lang="ts"');
    expect(out).toContain('data-line-numbers="true"');
    expect(out).toContain("--shiki-light:");
    expect(out).toContain("--shiki-dark:");
    expect(out.match(/class="line highlighted"/g)).toHaveLength(1);
  });

  it("shows an unknown language as plain text instead of failing", async () => {
    const out = await html("```madeup\n## One\n---\n## Two\n```");
    expect(out).toContain("<pre");
    expect(out).toContain("## One");
  });

  it("turns a callout block into an aside with its type and title", async () => {
    const out = await html(
      '```callout type=warning title="Careful"\nDon\'t **panic**.\n```',
    );
    expect(out).toContain(
      '<aside data-callout="warning" data-title="Careful">',
    );
    expect(out).toContain("<strong>panic</strong>");
  });

  it("falls back to a note for an unknown callout type", async () => {
    expect(await html("```callout type=loud\nHi\n```")).toContain(
      'data-callout="note"',
    );
  });

  it("makes an image with a title a figure with a caption", async () => {
    const out = await html('![A diagram](https://x.test/a.webp "Three hosts")');
    expect(out).toContain("<figure>");
    expect(out).toContain('alt="A diagram"');
    expect(out).toContain("<figcaption>Three hosts</figcaption>");
    expect(out).not.toContain("title=");
  });

  it("reads #wide and #decorative off the address", async () => {
    const wide = await html("![Big](https://x.test/a.webp#wide)");
    expect(wide).toContain('data-wide="true"');
    expect(wide).toContain('src="https://x.test/a.webp"');
    const decorative = await html(
      "![ignored](https://x.test/a.webp#decorative)",
    );
    expect(decorative).toContain('alt=""');
  });

  it("renders GFM tables and drops raw HTML", async () => {
    const out = await html(
      "| a | b |\n|---|---|\n| 1 | 2 |\n\n<script>alert(1)</script>\n\n<b>x</b>",
    );
    expect(out).toContain("<table>");
    expect(out).not.toContain("<script");
    expect(out).not.toContain("<b>");
  });
});

describe("rich blocks", { timeout: 30_000 }, () => {
  it("turns a valid block into an x-block carrying its parsed data", async () => {
    const out = await html("```quiz\nQ: One?\n) no\n*) yes\n```\n");
    expect(out).toContain("<x-block");
    expect(out).toContain('data-kind="quiz"');
    expect(out).toContain("One?");
    expect(out).not.toContain("<pre");
  });

  it("keeps a block that does not parse as plain code", async () => {
    const out = await html("```quiz\nQ: One?\n) no\n) also no\n```\n");
    expect(out).not.toContain("<x-block");
    expect(out).toContain("<pre");
  });

  it("turns a session fence into an x-block naming the session, and keeps a bad one as code", async () => {
    const ok = await html(
      '```session id=4f9c1a from=2 to=5 title="A title"\n```\n',
    );
    expect(ok).toContain('data-kind="session"');
    expect(ok).toContain("4f9c1a");
    const bad = await html("```session from=2\n```\n");
    expect(bad).not.toContain("<x-block");
  });

  it("leaves a block-named fence alone when it is not that block's language", async () => {
    expect(await html("```ts\nconst a = 1;\n```\n")).not.toContain("<x-block");
  });
});

describe("findProblems", () => {
  it("flags an image with no alt text, unless it is decorative", () => {
    expect(findProblems("![](https://x.test/a.png)")).toEqual([
      {
        level: "error",
        message: "The image https://x.test/a.png has no alt text.",
      },
    ]);
    expect(findProblems("![](https://x.test/a.png#decorative)")).toEqual([]);
    expect(findProblems("![A chart](https://x.test/a.png)")).toEqual([]);
  });

  it("warns about a skipped heading level", () => {
    expect(findProblems("## A\n\n#### B")).toEqual([
      { level: "warning", message: 'A heading jumps from level 2 to 4: "B".' },
    ]);
    expect(findProblems("## A\n\n### B\n\n## C")).toEqual([]);
  });

  it("flags an unknown callout type", () => {
    expect(findProblems("```callout type=loud\nHi\n```")[0]).toMatchObject({
      level: "error",
    });
    expect(findProblems("```callout type=tip\nHi\n```")).toEqual([]);
  });
});

describe("findProblems and rich blocks", () => {
  it("reports a block that can't be read, and accepts one that can", () => {
    const bad = findProblems("```quiz\nQ: One?\n) no\n) also no\n```\n");
    expect(bad).toHaveLength(1);
    expect(bad[0].level).toBe("error");
    expect(bad[0].message).toContain("quiz");
    expect(findProblems("```quiz\nQ: One?\n) no\n*) yes\n```\n")).toEqual([]);
  });
});
