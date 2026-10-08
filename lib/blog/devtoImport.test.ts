import { describe, expect, it } from "vitest";
import { articleToPost, convertDevMarkdown } from "./devtoImport";

describe("convertDevMarkdown", () => {
  it("leaves ordinary markdown, code and tables unchanged", () => {
    const body =
      "Intro.\n\n## Part\n\n```js\nconst a = '{% not a tag %}';\n```\n\n| a | b |\n| - | - |\n| 1 | 2 |\n";
    const out = convertDevMarkdown(body);
    expect(out.markdown).toBe(body);
    expect(out.warnings).toEqual([]);
  });

  it("turns embed, link, youtube and github tags into links", () => {
    const out = convertDevMarkdown(
      "{% embed https://example.com/a %}\n\n{% link https://dev.to/x/y %}\n\n{% youtube dQw4w9WgXcQ %}\n\n{% github user/repo %}\n",
    );
    expect(out.markdown).toContain(
      "[https://example.com/a](https://example.com/a)",
    );
    expect(out.markdown).toContain("[https://dev.to/x/y](https://dev.to/x/y)");
    expect(out.markdown).toContain(
      "[Watch on YouTube](https://www.youtube.com/watch?v=dQw4w9WgXcQ)",
    );
    expect(out.markdown).toContain("[user/repo](https://github.com/user/repo)");
    expect(out.warnings).toEqual([]);
    expect(out.notes.length).toBeGreaterThan(0);
  });

  it("turns details into a note callout, keeping code inside it", () => {
    const out = convertDevMarkdown(
      "Before\n\n{% details More info %}\nInside **text**.\n\n```bash\necho hi\n```\n{% enddetails %}\n\nAfter\n",
    );
    expect(out.markdown).toContain(
      '```callout type=note title="More info"\nInside **text**.',
    );
    expect(out.markdown).toContain("echo hi");
    expect(out.markdown).toContain("After");
    expect(out.markdown).not.toContain("enddetails");
    // the callout's fence is longer than the code inside it
    expect(out.markdown).toContain("````callout");
  });

  it("keeps any other tag as inline code and warns once per kind", () => {
    const out = convertDevMarkdown(
      "{% poll 123 %}\n\nText {% twitter 1 %} more {% twitter 2 %}\n",
    );
    expect(out.markdown).toContain("`{% poll 123 %}`");
    expect(out.markdown).toContain("`{% twitter 1 %}`");
    expect(out.warnings).toHaveLength(2);
    expect(out.warnings.join(" ")).toMatch(/2 \{% twitter %\} tags were kept/);
  });

  it("warns about images still on DEV and about a missing alt text", () => {
    const out = convertDevMarkdown(
      "![A](https://dev-to-uploads.s3.amazonaws.com/uploads/a.png)\n\n![](https://example.com/b.png)\n",
    );
    expect(out.warnings.some((w) => /still hosted on DEV/.test(w))).toBe(true);
    expect(out.warnings.some((w) => /no alt text/.test(w))).toBe(true);
  });

  it("reads and removes front matter", () => {
    const out = convertDevMarkdown(
      "---\ntitle: T\nseries: My series\ntags: a, b\n---\n\nBody\n",
    );
    expect(out.front.series).toBe("My series");
    expect(out.markdown).toBe("Body\n");
  });
});

describe("articleToPost", () => {
  const article = {
    id: 42,
    title: "Hello DEV",
    description: "",
    body_markdown:
      "---\nseries: S\n---\n\nThe opening **paragraph** of the article.\n\n## More\n",
    tag_list: "JavaScript, Web Dev, c++",
    cover_image: "https://dev.to/cover.png",
    url: "https://dev.to/me/hello-1abc",
    canonical_url: "https://dev.to/me/hello-1abc",
    published_at: "2025-03-01T10:00:00Z",
  };

  it("maps the fields, normalises tags, drops a DEV canonical, uses the opening for a missing description", () => {
    const post = articleToPost(article);
    expect(post).toMatchObject({
      title: "Hello DEV",
      description: "The opening paragraph of the article.",
      tags: ["javascript", "web-dev", "c"],
      coverUrl: "https://dev.to/cover.png",
      series: "S",
      canonicalUrl: null,
      publishedAt: "2025-03-01T10:00:00Z",
      devtoId: 42,
      devtoUrl: "https://dev.to/me/hello-1abc",
    });
    expect(post.warnings.some((w) => /no description/.test(w))).toBe(true);
    expect(post.notes.some((n) => /canonical/.test(n))).toBe(true);
  });

  it("keeps a canonical address that is elsewhere, and accepts tags as an array", () => {
    const post = articleToPost({
      ...article,
      description: "Given",
      canonical_url: "https://example.com/orig",
      tags: ["a", "b"],
    });
    expect(post.canonicalUrl).toBe("https://example.com/orig");
    expect(post.tags).toEqual(["a", "b"]);
    expect(post.description).toBe("Given");
  });

  it("shortens a long title and says so", () => {
    const post = articleToPost({ ...article, title: "x".repeat(150) });
    expect(post.title).toHaveLength(120);
    expect(post.warnings.some((w) => /title was shortened/.test(w))).toBe(true);
  });
});
