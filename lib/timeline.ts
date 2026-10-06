// Dates on a timeline entry (design.md §13.13).

type Dated = {
  startDate: string | null;
  endDate: string | null;
  datesLabel: string | null;
};

// `dates_label` is the owner's own wording ("Dec 2025 - Present") and wins;
// without it the label is built from the years: "2024 — NOW" while the entry
// has a start but no end.
export function timelineDates(entry: Dated): string {
  const label = entry.datesLabel?.trim();
  if (label) return label;
  const start = entry.startDate?.slice(0, 4);
  const end = entry.endDate?.slice(0, 4);
  if (!start && !end) return "";
  if (!start) return end ?? "";
  return `${start} — ${end ?? "NOW"}`;
}

// The machine-readable value for <time datetime>: the start date, as stored.
export function timelineDateTime(entry: Dated): string | undefined {
  return entry.startDate ?? undefined;
}
