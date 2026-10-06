import { describe, expect, it } from "vitest";
import { qrPath } from "./qr";

describe("qrPath", () => {
  it("makes a square path of dark modules", () => {
    const { size, d } = qrPath("https://wa.me/237676940247");
    expect(size).toBeGreaterThanOrEqual(21);
    expect(d.startsWith("M")).toBe(true);
    expect(d).toMatch(/^(M\d+ \d+h\d+v1h-\d+z)+$/);
  });

  it("is stable for the same text", () => {
    expect(qrPath("abc")).toEqual(qrPath("abc"));
  });
});
