import { describe, expect, it } from "vitest";
import { rollChars, rollStaggerMs } from "./roll";

describe("rollStaggerMs", () => {
  it("uses 15ms for short words", () => {
    expect(rollStaggerMs(1)).toBe(15);
    expect(rollStaggerMs(5)).toBe(15);
  });

  it("keeps the whole roll within 450ms for long words", () => {
    for (const length of [8, 11, 20, 40]) {
      const total = 300 + rollStaggerMs(length) * (length - 1);
      expect(total).toBeLessThanOrEqual(450.0001);
    }
  });

  it("shortens the stagger as the word gets longer", () => {
    expect(rollStaggerMs(20)).toBeLessThan(rollStaggerMs(12));
  });
});

describe("rollChars", () => {
  it("splits into characters, keeping spaces", () => {
    expect(rollChars("Hi you")).toEqual(["H", "i", " ", "y", "o", "u"]);
  });

  it("does not split a surrogate pair", () => {
    expect(rollChars("a😀")).toEqual(["a", "😀"]);
  });
});
