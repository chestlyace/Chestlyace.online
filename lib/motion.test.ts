import { describe, expect, it } from "vitest";
import { cubicBezier, easeInOut } from "./motion";

describe("cubicBezier", () => {
  it("starts at 0 and ends at 1", () => {
    expect(easeInOut(0)).toBe(0);
    expect(easeInOut(1)).toBe(1);
  });

  it("matches a linear curve", () => {
    const linear = cubicBezier(0, 0, 1, 1);
    for (const x of [0.1, 0.25, 0.5, 0.9]) {
      expect(linear(x)).toBeCloseTo(x, 4);
    }
  });

  it("matches independently solved points on the ease-in-out curve", () => {
    expect(easeInOut(0.25)).toBeCloseTo(0.05289, 4);
    expect(easeInOut(0.5)).toBeCloseTo(0.59597, 4);
    expect(easeInOut(0.75)).toBeCloseTo(0.95628, 4);
  });

  it("is symmetric for a symmetric curve", () => {
    const symmetric = cubicBezier(0.42, 0, 0.58, 1);
    expect(symmetric(0.5)).toBeCloseTo(0.5, 4);
    expect(symmetric(0.25) + symmetric(0.75)).toBeCloseTo(1, 4);
  });

  it("never decreases", () => {
    let previous = 0;
    for (let i = 0; i <= 100; i++) {
      const value = easeInOut(i / 100);
      expect(value).toBeGreaterThanOrEqual(previous - 1e-9);
      previous = value;
    }
  });
});
