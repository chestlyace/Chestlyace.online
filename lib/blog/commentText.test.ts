import { describe, expect, it } from "vitest";
import {
  DEFAULT_MAX_WORDS,
  countWords,
  maxWords,
  normalise,
  pieces,
} from "./commentText";

describe("pieces", () => {
  it("links web addresses and leaves everything else as text, trimming trailing punctuation", () => {
    expect(
      pieces("See https://example.com/a?b=1, then (https://x.test/y)."),
    ).toEqual([
      { type: "text", text: "See " },
      {
        type: "link",
        href: "https://example.com/a?b=1",
        text: "https://example.com/a?b=1",
      },
      { type: "text", text: ", then (" },
      { type: "link", href: "https://x.test/y", text: "https://x.test/y" },
      { type: "text", text: ")." },
    ]);
  });

  it("never turns HTML or other schemes into anything but text", () => {
    expect(pieces("<script>alert(1)</script> javascript:alert(1)")).toEqual([
      { type: "text", text: "<script>alert(1)</script> javascript:alert(1)" },
    ]);
    expect(pieces("plain\nlines")).toEqual([
      { type: "text", text: "plain\nlines" },
    ]);
  });
});

describe("words and limits", () => {
  it("counts words and compares repeats loosely", () => {
    expect(countWords("  one  two\nthree ")).toBe(3);
    expect(countWords("")).toBe(0);
    expect(normalise("Hello   WORLD\n")).toBe("hello world");
  });

  it("reads COMMENT_MAX_WORDS, falling back to 120 for nonsense", () => {
    expect(maxWords({})).toBe(DEFAULT_MAX_WORDS);
    expect(maxWords({ COMMENT_MAX_WORDS: "200" })).toBe(200);
    for (const bad of ["0", "-3", "abc", "1.5", "99999"])
      expect(maxWords({ COMMENT_MAX_WORDS: bad })).toBe(120);
  });
});
