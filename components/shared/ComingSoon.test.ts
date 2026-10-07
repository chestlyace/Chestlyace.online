import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { COMING_SOON } from "@/content/copy";
import { ComingSoon } from "./ComingSoon";

describe("ComingSoon", () => {
  it.each(["creatives", "blog"] as const)(
    "%s: one h1, the lead and a link to the main site",
    (site) => {
      const html = renderToStaticMarkup(createElement(ComingSoon, { site }));
      expect(html.match(/<h1/g)).toHaveLength(1);
      expect(html).toContain(COMING_SOON[site].title.replace("&", "&amp;"));
      expect(html).toContain("Coming soon");
      expect(html).toContain("Visit chestlyace.online");
      expect(html).toMatch(/<a [^>]*href="https?:\/\/[^"]*chestlyace[^"]*"/);
    },
  );
});

describe("coming-soon copy", () => {
  it("keeps both name forms on the creatives page", () => {
    expect(COMING_SOON.creatives.lead).toContain("Chestly Ace");
    expect(COMING_SOON.creatives.lead).toContain("Amahndong Chestly");
  });
});
