import { describe, expect, it } from "vitest";
import { config } from "./proxy";

// The matcher is a path pattern whose only construct is a negative lookahead,
// which a RegExp reads the same way.
const matches = (path: string) =>
  config.matcher.some((pattern) => new RegExp(`^${pattern}$`).test(path));

describe("proxy matcher", () => {
  it.each(["/", "/projects/alexdy", "/resume.pdf", "/sitemap.xml", "/admin"])(
    "runs for %s",
    (path) => {
      expect(matches(path)).toBe(true);
    },
  );

  it.each([
    "/_next/static/chunks/a.js",
    "/_next/image",
    "/_vercel/insights/script.js",
    "/_vercel/insights/view",
    "/hero.webp",
    "/favicon.ico",
  ])("leaves %s alone", (path) => {
    expect(matches(path)).toBe(false);
  });
});
