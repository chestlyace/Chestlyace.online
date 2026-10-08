import { describe, expect, it } from "vitest";
import { comment, exportChanges, markdownForDev } from "./devtoExport";

const URL = "https://blog.example/my-post";

describe("markdownForDev", () => {
  it("writes each custom block as plain markdown and closes with where it was first published", () => {
    const md = [
      "Intro **text**.",
      '```callout type=tip title="Heads up"\nBe careful.\n```',
      "```steps\n## One\nDo this.\n---\n## Two\n```",
      "```compare\ntitle: A vs B\n| X | A | B |\n| speed | slow | fast |\n```",
      "```filetree\napp/\n  page.tsx  # The page\n```",
      '```typewriter lang=bash title="a.sh"\necho hi  // @ Say hi\n```',
      "```codegroup\n--- ts a.ts\nconst a = 1;\n--- json a.json\n{}\n```",
      "```diff lang=ts\n- old\n+ new\n```",
      "```terminal\n$ ls\nfile\n```",
      "```flow\n[a|group] Group\n[b|parent:a|desc:Inside] Box\n[c] Other\nb --> c : calls\n```",
      "```quiz\nQ: Which?\n) A\n*) B\nE: Because.\n```",
    ].join("\n\n");
    const out = markdownForDev(md, URL);
    expect(out).toContain("Intro **text**.");
    expect(out).toContain("> **Tip: Heads up**\n>\n> Be careful.");
    expect(out).toContain("### 1. One\n\nDo this.\n\n### 2. Two");
    expect(out).toContain(
      "**A vs B**\n\n| X | A | B |\n| --- | --- | --- |\n| speed | slow | fast |",
    );
    expect(out).toContain("```text\napp/\n  page.tsx  # The page\n```");
    expect(out).toContain("```bash\necho hi  # Say hi\n```");
    expect(out).toContain(
      "**a.ts**\n\n```ts\nconst a = 1;\n```\n\n**a.json**\n\n```json\n{}\n```",
    );
    expect(out).toContain("```diff\n- old\n+ new\n```");
    expect(out).toContain("```console\n$ ls\nfile\n```");
    expect(out).toContain("- Box: Inside (inside Group)");
    expect(out).toContain("- Box → Other: calls");
    expect(out).toContain(
      "### Quiz\n\n**1. Which?**\n\n- A\n- ✅ B\n\n*Because.*",
    );
    expect(
      out.endsWith(`---\n\n*Originally published at [${URL}](${URL}).*\n`),
    ).toBe(true);
    expect(out).not.toMatch(
      /```(steps|compare|typewriter|codegroup|terminal|quiz|flow|filetree|callout)/,
    );
  });

  it("drops an image's wide and decorative marks and writes a session as a link", () => {
    const out = markdownForDev(
      "![Alt](https://x.test/a.webp#wide)\n\n```session id=3 from=1 to=4\n```",
      URL,
    );
    expect(out).toContain("![Alt](https://x.test/a.webp)");
    expect(out).not.toContain("#wide");
    expect(out).toContain(`[see it here](${URL})`);
  });
});

describe("comment and exportChanges", () => {
  it("uses the language's own comment", () => {
    expect(comment("python", "x")).toBe("# x");
    expect(comment("sql", "x")).toBe("-- x");
    expect(comment("html", "x")).toBe("<!-- x -->");
    expect(comment("css", "x")).toBe("/* x */");
    expect(comment("ts", "x")).toBe("// x");
  });

  it("lists the custom blocks with counts, and nothing for plain text", () => {
    expect(exportChanges("Just text.\n\n## Heading")).toEqual([]);
    const changes = exportChanges(
      "```steps\n## A\n```\n\n```steps\n## B\n```\n\n```quiz\nQ: A?\n*) y\n) n\n```",
    );
    expect(changes.map((c) => [c.name, c.count])).toEqual([
      ["Steps", 2],
      ["Quiz", 1],
    ]);
  });
});
