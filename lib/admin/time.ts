// "5 minutes ago", "3 days ago": for "Last edited" on the dashboard.
export function relativeTime(
  date: Date | null,
  now: Date = new Date(),
): string {
  if (!date) return "never";
  const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
  if (seconds < 45) return "just now";
  const units: [string, number][] = [
    ["year", 365 * 86400],
    ["month", 30 * 86400],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [unit, size] of units) {
    if (seconds >= size) {
      const count = Math.round(seconds / size);
      return `${count} ${unit}${count === 1 ? "" : "s"} ago`;
    }
  }
  return "just now";
}

/** The current time, for a server-rendered screen that must show "5 minutes ago". */
export const serverNow = () => new Date();
