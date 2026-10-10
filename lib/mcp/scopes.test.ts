import { describe, expect, it } from "vitest";
import { hasScope, isScope, normalizeScopes } from "./scopes";

describe("scopes", () => {
  it("always include read, drop what is unknown, keep a fixed order", () => {
    expect(normalizeScopes([])).toEqual(["read"]);
    expect(normalizeScopes(["delete", "write", "bogus", "write", 3])).toEqual([
      "read",
      "write",
      "delete",
    ]);
  });

  it("checks a scope; read is always allowed", () => {
    expect(hasScope([], "read")).toBe(true);
    expect(hasScope(["read", "write"], "write")).toBe(true);
    expect(hasScope(["read", "write"], "delete")).toBe(false);
    expect(isScope("media")).toBe(true);
    expect(isScope("admin")).toBe(false);
  });
});
