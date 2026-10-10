import { describe, expect, it } from "vitest";
import type { PublicEvent, PublicPiece } from "./data";
import { featuredWork, portalImages, statementLines } from "./home";

const image = (url: string) => ({ url, width: 10, height: 10, alt: url });
const piece = (slug: string, isFeatured: boolean) =>
  ({ slug, title: slug, cover: image(slug), isFeatured }) as PublicPiece;
const event = (slug: string, isFeatured: boolean) =>
  ({ slug, title: slug, cover: image(slug), isFeatured }) as PublicEvent;

describe("featuredWork", () => {
  it("alternates pieces and events and leaves out the rest", () => {
    const work = featuredWork(
      [piece("d1", true), piece("d2", true), piece("d3", false)],
      [event("e1", true), event("e2", false)],
    );
    expect(work.map((w) => w.slug)).toEqual(["d1", "e1", "d2"]);
    expect(work[0].href).toBe("/design?piece=d1");
    expect(work[1].href).toBe("/photography/e1");
  });

  it("stops at the limit", () => {
    const pieces = Array.from({ length: 6 }, (_, i) => piece(`d${i}`, true));
    const events = Array.from({ length: 6 }, (_, i) => event(`e${i}`, true));
    expect(featuredWork(pieces, events, 8)).toHaveLength(8);
    expect(featuredWork(pieces, events, 3)).toHaveLength(3);
  });

  it("is empty with nothing featured", () => {
    expect(featuredWork([piece("d", false)], [event("e", false)])).toEqual([]);
  });
});

describe("statementLines", () => {
  it("splits at the ampersand", () => {
    expect(statementLines("Design & Photography")).toEqual([
      "Design",
      "& Photography",
    ]);
  });

  it("keeps a statement without one on a line", () => {
    expect(statementLines("  Making   things ")).toEqual(["Making things"]);
    expect(statementLines("& Only")).toEqual(["& Only"]);
  });
});

describe("portalImages", () => {
  it("prefers the featured one, else the first, else nothing", () => {
    const both = portalImages(
      [piece("a", false), piece("b", true)],
      [event("x", false), event("y", false)],
    );
    expect(both.design?.url).toBe("b");
    expect(both.photography?.url).toBe("x");
    expect(portalImages([], [])).toEqual({ design: null, photography: null });
  });
});
