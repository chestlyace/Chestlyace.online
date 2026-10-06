import { describe, expect, it } from "vitest";
import { isHttpUrl, isPagePath } from "./links";

describe("isPagePath", () => {
  it("accepts site paths, with queries and hashes", () => {
    for (const href of ["/", "/projects/alexdy", "/#about", "/?site=blog"]) {
      expect(isPagePath(href)).toBe(true);
    }
  });

  it("rejects files, which are not pages", () => {
    for (const href of ["/resume.pdf", "/certs/a.png", "/a/b/hero.webp?x=1"]) {
      expect(isPagePath(href)).toBe(false);
    }
  });

  it("rejects external, protocol-relative, hash-only and mailto links", () => {
    for (const href of [
      "https://example.com/",
      "//evil.example/x",
      "#top",
      "mailto:a@b.c",
      "tel:+1",
    ]) {
      expect(isPagePath(href)).toBe(false);
    }
  });

  it("keeps a dot inside a folder name from counting as a file", () => {
    expect(isPagePath("/v1.2/overview")).toBe(true);
  });
});

describe("isHttpUrl", () => {
  it("accepts web addresses", () => {
    expect(isHttpUrl("https://github.com/chestlyace")).toBe(true);
    expect(isHttpUrl("http://example.com")).toBe(true);
  });

  it("rejects script, data, mail, relative and malformed values", () => {
    for (const href of [
      "javascript:alert(1)",
      "JaVaScRiPt:alert(1)",
      "data:text/html,<script>1</script>",
      "mailto:a@b.c",
      "/relative",
      "github.com/x",
      "",
      "not a url",
    ]) {
      expect(isHttpUrl(href)).toBe(false);
    }
  });
});
