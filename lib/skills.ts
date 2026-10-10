import deviconMeta from "devicon/devicon.json";
import { isHttpUrl } from "@/lib/links";

// The Skills section's data rules (design.md §14.3).

export const SKILL_GROUPS = [
  { category: "language", label: "Languages" },
  { category: "framework", label: "Frameworks" },
  { category: "database", label: "Databases" },
  { category: "cloud", label: "Cloud & DevOps" },
  { category: "tool", label: "Tools" },
] as const;

export type SkillGroup<T> = { category: string; label: string; skills: T[] };

// Skills in group order, keeping the owner's order inside each group; groups with
// nothing in them are left out.
export function groupSkills<T extends { category: string }>(
  skills: readonly T[],
  /** The group names in the page's language, by category. */
  labels?: Record<string, string>,
): SkillGroup<T>[] {
  return SKILL_GROUPS.map(({ category, label }) => ({
    category,
    label: labels?.[category] ?? label,
    skills: skills.filter((skill) => skill.category === category),
  })).filter((group) => group.skills.length > 0);
}

type DeviconEntry = {
  name: string;
  versions: { svg: string[] };
  color: string;
};

const META = new Map(
  (deviconMeta as DeviconEntry[]).map((entry) => [entry.name, entry]),
);

// For the single-colour version (a mask in the theme's text colour) the glyph
// that reads best comes first; for the colour version, the full-colour mark.
const MONO_ORDER = [
  "plain",
  "original",
  "line",
  "plain-wordmark",
  "original-wordmark",
  "line-wordmark",
];
const COLOR_ORDER = [
  "original",
  "plain",
  "original-wordmark",
  "plain-wordmark",
  "line",
];

export function pickVariant(
  available: readonly string[],
  order: readonly string[],
): string | null {
  return (
    order.find((variant) => available.includes(variant)) ?? available[0] ?? null
  );
}

// Brand colours that are near black or near white would vanish in one of the
// themes, so those logos never switch to colour (design.md §14.3).
export function isNearBlackOrWhite(hex: string): boolean {
  const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return false;
  const full =
    match[1].length === 3
      ? match[1]
          .split("")
          .map((c) => c + c)
          .join("")
      : match[1];
  const channel = (offset: number) => {
    const value = parseInt(full.slice(offset, offset + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  const luminance =
    0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4);
  return luminance < 0.08 || luminance > 0.9;
}

export type SkillIcon =
  /** Files in public/devicon/ (copied by scripts/sync-devicon.mjs), without ".svg". */
  | { kind: "devicon"; mono: string; color: string | null }
  /** An image from elsewhere (the old data has one, for AWS). */
  | { kind: "url"; src: string }
  | null;

const SLUG = /^[a-z0-9-]+$/i;

export function skillIcon(skill: {
  iconSlug: string | null;
  iconUrl: string | null;
}): SkillIcon {
  const slug = skill.iconSlug?.trim();
  const entry =
    slug && SLUG.test(slug) ? META.get(slug.toLowerCase()) : undefined;
  if (entry) {
    const available = entry.versions.svg;
    const mono = pickVariant(available, MONO_ORDER);
    const color = pickVariant(available, COLOR_ORDER);
    if (mono) {
      return {
        kind: "devicon",
        mono: `${entry.name}-${mono}`,
        color:
          color && !isNearBlackOrWhite(entry.color)
            ? `${entry.name}-${color}`
            : null,
      };
    }
  }
  const url = skill.iconUrl?.trim();
  return url && isHttpUrl(url) ? { kind: "url", src: url } : null;
}
