import { describe, expect, it } from "vitest";
import { NOT_FOUND } from "./ui";

describe("the not-found and error words", () => {
  it("are in both languages with the same keys, and French is not English", () => {
    expect(Object.keys(NOT_FOUND.fr).sort()).toEqual(
      Object.keys(NOT_FOUND.en).sort(),
    );
    const same = (
      Object.keys(NOT_FOUND.en) as (keyof typeof NOT_FOUND.en)[]
    ).filter(
      (key) =>
        NOT_FOUND.en[key] === NOT_FOUND.fr[key] &&
        !["contact", "services"].includes(key),
    );
    expect(same).toEqual([]);
  });

  it("say 404 in the headline, so the page's meaning does not rest on the big number", () => {
    expect(NOT_FOUND.en.headline).toMatch(/404/);
    expect(NOT_FOUND.fr.headline).toMatch(/404/);
  });
});
