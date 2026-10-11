import { describe, expect, it } from "vitest";
import { HOME_PROJECT_COUNT, homeProjects, rightColumnFlags } from "./projects";

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

describe("homeProjects", () => {
  it("keeps the first two, in the order they arrive", () => {
    expect(HOME_PROJECT_COUNT).toBe(2);
    expect(homeProjects(["a", "b", "c", "d"])).toEqual(["a", "b"]);
  });

  it("returns what there is when there are fewer", () => {
    expect(homeProjects(["a"])).toEqual(["a"]);
    expect(homeProjects([])).toEqual([]);
  });
});
