import { describe, expect, it } from "vitest";
import { timelineDateTime, timelineDates } from "./timeline";

const entry = { startDate: null, endDate: null, datesLabel: null };

describe("timelineDates", () => {
  it("prefers the owner's label", () => {
    expect(
      timelineDates({
        ...entry,
        startDate: "2025-06-01",
        datesLabel: " Jun 2025 - Present ",
      }),
    ).toBe("Jun 2025 - Present");
  });

  it("builds from the years, with NOW for an open entry", () => {
    expect(timelineDates({ ...entry, startDate: "2024-09-01" })).toBe(
      "2024 — NOW",
    );
    expect(
      timelineDates({
        ...entry,
        startDate: "2023-01-01",
        endDate: "2025-01-01",
      }),
    ).toBe("2023 — 2025");
  });

  it("copes with missing dates", () => {
    expect(timelineDates(entry)).toBe("");
    expect(timelineDates({ ...entry, endDate: "2020-05-01" })).toBe("2020");
  });
});

describe("timelineDateTime", () => {
  it("is the start date or nothing", () => {
    expect(timelineDateTime({ ...entry, startDate: "2024-09-01" })).toBe(
      "2024-09-01",
    );
    expect(timelineDateTime(entry)).toBeUndefined();
  });
});
