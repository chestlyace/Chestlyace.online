import { describe, expect, it } from "vitest";
import { rightColumnFlags } from "./projects";

describe("rightColumnFlags", () => {
  it("alternates left and right for plain projects", () => {
    expect(rightColumnFlags([false, false, false, false])).toEqual([
      false,
      true,
      false,
      true,
    ]);
  });

  it("never offsets featured rows, and starts the columns after them", () => {
    expect(rightColumnFlags([true, true, false, false, false])).toEqual([
      false,
      false,
      false,
      true,
      false,
    ]);
  });

  it("handles none and one", () => {
    expect(rightColumnFlags([])).toEqual([]);
    expect(rightColumnFlags([false])).toEqual([false]);
  });
});
