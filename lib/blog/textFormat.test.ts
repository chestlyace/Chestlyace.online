import { describe, expect, it } from "vitest";
import { applyFormat } from "./textFormat";

describe("applyFormat", () => {
  it("wraps the selection and keeps it selected", () => {
    expect(applyFormat("a big cat", 2, 5, "bold")).toEqual({
      text: "a **big** cat",
      start: 4,
      end: 7,
    });
    expect(applyFormat("x", 0, 1, "italic").text).toBe("*x*");
    expect(applyFormat("x", 0, 1, "code").text).toBe("`x`");
  });

  it("takes the marks off when applied again, and works with nothing selected", () => {
    expect(applyFormat("a **big** cat", 4, 7, "bold")).toEqual({
      text: "a big cat",
      start: 2,
      end: 5,
    });
    expect(applyFormat("ab", 1, 1, "bold").text).toBe("a****b");
  });

  it("makes a link and selects the address", () => {
    const edit = applyFormat("see docs now", 4, 8, "link");
    expect(edit.text).toBe("see [docs](https://) now");
    expect(edit.text.slice(edit.start, edit.end)).toBe("https://");
    expect(applyFormat("", 0, 0, "link").text).toBe("[link text](https://)");
  });

  it("turns the selected lines into a list", () => {
    expect(applyFormat("one\ntwo\nthree", 0, 13, "bullets").text).toBe(
      "- one\n- two\n- three",
    );
    expect(applyFormat("intro\none\ntwo", 6, 13, "numbers").text).toBe(
      "intro\n1. one\n2. two",
    );
  });
});
