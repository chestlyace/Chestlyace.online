import { describe, expect, it } from "vitest";
import { CLOUD, LOOP, MORPH_SECONDS, Timeline } from "./timeline";

describe("the loop", () => {
  it("is the owner's sequence", () => {
    expect(LOOP.map((form) => form.id)).toEqual([
      "name",
      "braces",
      "lattice",
      "developer",
      "bezier",
      "wheel",
      "designer",
      "camera",
      "aperture",
      "photographer",
    ]);
    expect(LOOP.filter((f) => f.kind === "word").map((f) => f.text)).toEqual([
      "CHESTLY ACE",
      "DEVELOPER",
      "DESIGNER",
      "PHOTOGRAPHER",
    ]);
  });

  it("takes about 45 seconds", () => {
    const total = LOOP.reduce((sum, f) => sum + f.hold + MORPH_SECONDS, 0);
    expect(total).toBeGreaterThan(40);
    expect(total).toBeLessThan(50);
  });
});

describe("the timeline", () => {
  it("starts by gathering the cloud into the name", () => {
    const t = new Timeline();
    expect([t.from, t.to, t.morphing]).toEqual([CLOUD, 0, true]);
    t.update(MORPH_SECONDS / 2);
    expect(t.mix).toBeCloseTo(0.5);
    const ended = t.update(MORPH_SECONDS).ended;
    expect(ended).toBe(true);
    expect([t.from, t.to, t.morphing]).toEqual([0, 0, false]);
  });

  it("holds each form, then morphs to the next", () => {
    const t = new Timeline();
    t.update(MORPH_SECONDS);
    expect(t.update(LOOP[0].hold - 0.1).started).toBe(false);
    const event = t.update(0.2);
    expect(event.started).toBe(true);
    expect([t.from, t.to, t.morphing]).toEqual([0, 1, true]);
  });

  it("wraps from the last form to the first", () => {
    const t = new Timeline();
    for (let i = 0; i < 200 && !(t.from === LOOP.length - 1 && t.to === 0); i++)
      t.update(0.5);
    expect([t.from, t.to]).toEqual([LOOP.length - 1, 0]);
  });

  it("moves on at once for a tap, but not in the middle of a morph", () => {
    const t = new Timeline();
    expect(t.skip()).toBe(false); // still gathering
    t.update(MORPH_SECONDS);
    expect(t.skip()).toBe(true);
    expect([t.from, t.to, t.morphing]).toEqual([0, 1, true]);
    expect(t.skip()).toBe(false);
  });
});
