import { describe, expect, it } from "vitest";
import { relativeTime } from "./time";

const now = new Date("2026-10-06T12:00:00Z");
const ago = (seconds: number) => new Date(now.getTime() - seconds * 1000);

describe("relativeTime", () => {
  it.each([
    [10, "just now"],
    [120, "2 minutes ago"],
    [3600, "1 hour ago"],
    [5 * 3600, "5 hours ago"],
    [86400, "1 day ago"],
    [3 * 86400, "3 days ago"],
    [45 * 86400, "2 months ago"],
    [800 * 86400, "2 years ago"],
  ])("%is → %s", (seconds, expected) => {
    expect(relativeTime(ago(seconds), now)).toBe(expected);
  });

  it("says never for no date", () => {
    expect(relativeTime(null, now)).toBe("never");
  });
});
