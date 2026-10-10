/* eslint-disable react/no-children-prop -- the provider's props type needs `children` */
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LangProvider } from "@/components/shared/LangProvider";
import { ErrorPage } from "./ErrorPage";

const page = (lang: "en" | "fr") =>
  renderToStaticMarkup(
    createElement(LangProvider, {
      lang,
      children: createElement(ErrorPage, {
        error: new Error("secret detail"),
        reset: () => {},
      }),
    }),
  );

describe("the error page", () => {
  it("says what happened in the visitor's language and offers a way on", () => {
    const en = page("en");
    expect(en).toContain("Something broke on our side");
    expect(en).toContain("Try again");
    expect(en).toContain("Home");
    const fr = page("fr");
    expect(fr).toContain("Un problème est survenu de notre côté");
    expect(fr).toContain("Réessayer");
    expect(fr).toContain("Accueil");
  });

  it("never shows the error's own text", () => {
    expect(page("en")).not.toContain("secret detail");
  });

  it("has one h1 and the big word is decoration", () => {
    const out = page("en");
    expect(out.match(/<h1/g)).toHaveLength(1);
    expect(out).toContain('aria-hidden="true"');
  });
});
