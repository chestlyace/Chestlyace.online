// Small data helpers for the About section (design.md §14.2).

// profile.about_body is paragraphs separated by blank lines.
export function splitParagraphs(text: string | null | undefined): string[] {
  return (text ?? "")
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim().replace(/\s*\n\s*/g, " "))
    .filter(Boolean);
}

export type Fact = { label: string; value: string };

// The facts list beside the About text (a proposal in the spec, built from
// existing profile fields). Rows with nothing to show are left out. STATUS only
// exists for "open" — the other availability states aren't designed yet (D29).
export function aboutFacts(
  profile: {
    location: string | null;
    headline: string;
    tagline: string | null;
    availability: string | null;
  },
  labels = { basedIn: "Based in", role: "Role", status: "Status" },
): Fact[] {
  const facts: Fact[] = [];
  const location = profile.location?.trim();
  if (location) facts.push({ label: labels.basedIn, value: location });
  if (profile.headline.trim()) {
    facts.push({ label: labels.role, value: profile.headline.trim() });
  }
  const status = profile.tagline?.trim();
  if (status && profile.availability === "open") {
    facts.push({ label: labels.status, value: status });
  }
  return facts;
}
