import { createElement, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BrandLoader } from "./BrandLoader";
import { LangProvider } from "./LangProvider";

const html = (node: ReactElement, lang: "en" | "fr" = "en") =>
  renderToStaticMarkup(
    // eslint-disable-next-line react/no-children-prop -- the provider's props type needs it
    createElement(LangProvider, { lang, children: node }),
  );

describe("BrandLoader", () => {
  it("is a polite status with its text for screen readers, in the page's language", () => {
    const en = html(createElement(BrandLoader, { size: "lg" }));
    expect(en).toContain('role="status"');
    expect(en).toContain('aria-live="polite"');
    expect(en).toContain(">Loading<");
    expect(html(createElement(BrandLoader), "fr")).toContain(">Chargement<");
    expect(html(createElement(BrandLoader, { label: "Saving" }))).toContain(
      ">Saving<",
    );
  });

  it("hides the drawing from them, and draws the name letter by letter", () => {
    const out = html(createElement(BrandLoader, { size: "lg" }));
    expect(out).toContain('aria-hidden="true"');
    expect(out.match(/loader-letter/g)).toHaveLength(11);
    expect(out).toContain("animation-delay:400ms"); // the 11th letter, 40ms apart
    expect(out).toContain("loader-line");
    expect(out).toContain('pathLength="1"');
  });

  it("the medium size has no line, the small one is only the ring", () => {
    const md = html(createElement(BrandLoader, { size: "md" }));
    expect(md).not.toContain("loader-line");
    expect(md).toContain("loader-letter");
    const sm = html(
      createElement(BrandLoader, { size: "sm", decorative: true }),
    );
    expect(sm).toContain("loader-ring");
    expect(sm).not.toContain("loader-letter");
    expect(sm).not.toContain('role="status"');
  });

  it("a decorative loader adds no status of its own", () => {
    expect(
      html(createElement(BrandLoader, { decorative: true })),
    ).not.toContain('role="status"');
  });

  it("the lightbox tone keeps the letters light", () => {
    expect(html(createElement(BrandLoader, { tone: "light" }))).toContain(
      "text-[#f5f5f7]",
    );
  });
});
