import { describe, expect, it } from "vitest";
import {
  activeEntry,
  indexToProgress,
  progressToIndex,
  wheelLook,
} from "./wheel";

describe("progressToIndex", () => {
  it("holds the first and last entry, and runs evenly between", () => {
    expect(progressToIndex(0, 6)).toBe(0);
    expect(progressToIndex(0.05, 6)).toBe(0);
    expect(progressToIndex(0.5, 6)).toBeCloseTo(2.5, 5);
    expect(progressToIndex(0.95, 6)).toBe(5);
    expect(progressToIndex(1, 6)).toBe(5);
  });

  it("has nowhere to go with fewer than two entries", () => {
    expect(progressToIndex(0.7, 1)).toBe(0);
    expect(progressToIndex(0.7, 0)).toBe(0);
  });
});

describe("indexToProgress", () => {
  it("is the inverse of progressToIndex", () => {
    for (const i of [0, 1, 2.5, 5]) {
      expect(progressToIndex(indexToProgress(i, 6), 6)).toBeCloseTo(i, 5);
    }
  });

  it("clamps to the list", () => {
    expect(indexToProgress(-3, 4)).toBe(indexToProgress(0, 4));
    expect(indexToProgress(99, 4)).toBe(indexToProgress(3, 4));
  });
});

describe("activeEntry", () => {
  it("rounds to the nearest entry within the list", () => {
    expect(activeEntry(1.49, 6)).toBe(1);
    expect(activeEntry(1.5, 6)).toBe(2);
    expect(activeEntry(-1, 6)).toBe(0);
    expect(activeEntry(9, 6)).toBe(5);
  });
});

describe("wheelLook", () => {
  it("is full strength in the spotlight and fades with distance", () => {
    expect(wheelLook(0)).toEqual({ opacity: 1, scale: 1 });
    expect(wheelLook(1).opacity).toBeCloseTo(0.4, 5);
    expect(wheelLook(1).scale).toBeCloseTo(0.9, 5);
    expect(wheelLook(-1)).toEqual(wheelLook(1));
    expect(wheelLook(5).opacity).toBe(0.15);
    expect(wheelLook(5).scale).toBeCloseTo(0.8, 5);
  });
});
