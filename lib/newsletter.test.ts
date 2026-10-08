import { describe, expect, it } from "vitest";
import { cleanEmail } from "./newsletter";

describe("cleanEmail", () => {
  it("trims and lower-cases a good address", () => {
    expect(cleanEmail("  Ada@Example.COM ")).toBe("ada@example.com");
  });

  it("refuses what isn't an address", () => {
    for (const value of [
      "",
      "ada",
      "ada@",
      "@example.com",
      "ada@example",
      "a b@example.com",
      `${"a".repeat(200)}@example.com`,
      42,
      null,
      undefined,
    ])
      expect(cleanEmail(value)).toBeNull();
  });
});
