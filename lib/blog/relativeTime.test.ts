import { describe, expect, it } from "vitest";
import { fullDate, relativeTime } from "./relativeTime";

const now = Date.parse("2026-10-08T12:00:00Z");
const ago = (ms: number) => new Date(now - ms).toISOString();

describe("relativeTime", () => {
  it("reads like a person would say it", () => {
    expect(relativeTime(ago(10_000), now)).toBe("just now");
    expect(relativeTime(ago(5 * 60_000), now)).toBe("5 minutes ago");
    expect(relativeTime(ago(3 * 3600_000), now)).toBe("3 hours ago");
    expect(relativeTime(ago(86_400_000), now)).toBe("yesterday");
    expect(relativeTime(ago(3 * 86_400_000), now)).toBe("3 days ago");
    expect(relativeTime(ago(45 * 86_400_000), now)).toBe("last month");
    expect(relativeTime(ago(800 * 86_400_000), now)).toBe("2 years ago");
    expect(relativeTime("not a date", now)).toBe("");
  });

  it("gives the full date for the title", () => {
    expect(fullDate("2026-10-08T09:30:00Z")).toBe(
      "8 October 2026 at 09:30 UTC",
    );
  });
});

describe("in French", () => {
  it("reads the time and the full date in French", () => {
    expect(relativeTime(ago(10_000), now, "fr", "à l’instant")).toBe(
      "à l’instant",
    );
    expect(relativeTime(ago(3 * 86_400_000), now, "fr")).toBe("il y a 3 jours");
    expect(fullDate("2026-10-08T09:30:00Z", "fr")).toContain("octobre");
  });
});
