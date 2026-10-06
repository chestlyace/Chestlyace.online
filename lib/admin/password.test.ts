import bcrypt from "bcryptjs";
import { describe, expect, it } from "vitest";
import { verifyPassword } from "./password";

describe("verifyPassword", () => {
  const hash = bcrypt.hashSync("correct horse", 4);

  it("accepts the right password and refuses a wrong one", async () => {
    expect(await verifyPassword("correct horse", hash)).toBe(true);
    expect(await verifyPassword("wrong horse", hash)).toBe(false);
  });

  it("refuses everything without a usable hash", async () => {
    expect(await verifyPassword("correct horse", undefined)).toBe(false);
    expect(await verifyPassword("correct horse", "")).toBe(false);
    expect(await verifyPassword("correct horse", "not-a-hash")).toBe(false);
    // A hash whose `$` signs were eaten by .env expansion
    expect(
      await verifyPassword("correct horse", hash.replaceAll("$", "")),
    ).toBe(false);
  });

  it("refuses empty and oversized passwords", async () => {
    expect(await verifyPassword("", hash)).toBe(false);
    expect(await verifyPassword("x".repeat(500), hash)).toBe(false);
  });
});
