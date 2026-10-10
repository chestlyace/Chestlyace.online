import { createElement, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LangProvider } from "./LangProvider";
import { SkeletonBlock, SkeletonShell, SkeletonText } from "./Skeleton";
import { GallerySkeleton, EventSkeleton } from "../skeletons/creatives";
import { BlogListSkeleton, PostSkeleton } from "../skeletons/blog";
import { MainHomeSkeleton } from "../skeletons/main";

const html = (node: ReactElement, lang: "en" | "fr" = "en") =>
  renderToStaticMarkup(
    // eslint-disable-next-line react/no-children-prop -- the provider's props type needs it
    createElement(LangProvider, { lang, children: node }),
  );

describe("skeletons", () => {
  it("a block is a hidden shimmering box", () => {
    const out = html(createElement(SkeletonBlock, { className: "h-4 w-1/2" }));
    expect(out).toContain('aria-hidden="true"');
    expect(out).toContain("skeleton");
    expect(out).toContain("h-4 w-1/2");
  });

  it("text has as many lines as asked, with ragged widths", () => {
    const out = html(createElement(SkeletonText, { count: 4 }));
    expect(out.match(/class="skeleton/g)).toHaveLength(4);
    expect(out).toContain("width:72%");
  });

  it("a page's skeleton is busy and says so once, in the page's language", () => {
    const en = html(createElement(SkeletonShell, null, "x"));
    expect(en).toContain('aria-busy="true"');
    expect(en).toContain(">Loading<");
    expect(html(createElement(SkeletonShell, null, "x"), "fr")).toContain(
      ">Chargement<",
    );
    for (const page of [
      createElement(MainHomeSkeleton),
      createElement(BlogListSkeleton),
      createElement(PostSkeleton),
      createElement(GallerySkeleton),
      createElement(EventSkeleton),
    ]) {
      const out = html(page);
      expect(out.match(/role="status"/g)).toHaveLength(1);
      expect(out.match(/aria-busy="true"/g)).toHaveLength(1);
    }
  });
});
