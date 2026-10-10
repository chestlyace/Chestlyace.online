import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { en } from "@/content/messages/en";
import { ComingSoon } from "./ComingSoon";

describe("ComingSoon", () => {
  it.each(["creatives", "blog"] as const)(
    "%s: one h1, the lead and a link to the main site",
    (site) => {
      const html = renderToStaticMarkup(createElement(ComingSoon, { site }));
      expect(html.match(/<h1/g)).toHaveLength(1);
      expect(html).toContain(en.comingSoon[site].title.replace("&", "&amp;"));
      expect(html).toContain("Coming soon");
      expect(html).toContain("Visit chestlyace.online");
      expect(html).toMatch(/<a [^>]*href="https?:\/\/[^"]*chestlyace[^"]*"/);
    },
  );
});

describe("coming-soon copy", () => {
  it("keeps both name forms on the creatives page", () => {
    expect(en.comingSoon.creatives.lead).toContain("Chestly Ace");
    expect(en.comingSoon.creatives.lead).toContain("Amahndong Chestly");
  });
});
