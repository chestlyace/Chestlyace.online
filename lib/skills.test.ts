import { describe, expect, it } from "vitest";
import {
  groupSkills,
  isNearBlackOrWhite,
  pickVariant,
  skillIcon,
} from "./skills";

describe("groupSkills", () => {
  const skill = (name: string, category: string) => ({ name, category });

  it("orders groups Languages, Frameworks, Databases, Cloud & DevOps, Tools", () => {
    const groups = groupSkills([
      skill("Git", "tool"),
      skill("AWS", "cloud"),
      skill("Postgres", "database"),
      skill("React", "framework"),
      skill("Python", "language"),
    ]);
    expect(groups.map((g) => g.label)).toEqual([
      "Languages",
      "Frameworks",
      "Databases",
      "Cloud & DevOps",
      "Tools",
    ]);
  });

  it("keeps the given order inside a group", () => {
    const [group] = groupSkills([
      skill("B", "language"),
      skill("A", "language"),
      skill("C", "language"),
    ]);
    expect(group.skills.map((s) => s.name)).toEqual(["B", "A", "C"]);
  });

  it("leaves out empty groups and unknown categories", () => {
    const groups = groupSkills([skill("X", "mystery"), skill("Git", "tool")]);
    expect(groups.map((g) => g.category)).toEqual(["tool"]);
    expect(groupSkills([])).toEqual([]);
  });
});

describe("pickVariant", () => {
  it("takes the first available variant in the preferred order", () => {
    expect(pickVariant(["original", "plain"], ["plain", "original"])).toBe(
      "plain",
    );
    expect(pickVariant(["original"], ["plain", "original"])).toBe("original");
  });

  it("falls back to whatever exists, or null", () => {
    expect(pickVariant(["odd"], ["plain"])).toBe("odd");
    expect(pickVariant([], ["plain"])).toBeNull();
  });
});

describe("isNearBlackOrWhite", () => {
  it("flags colours that would vanish on a light or a dark page", () => {
    for (const hex of [
      "#000",
      "#000000",
      "#444",
      "#092e20",
      "#fff",
      "#FAFAFA",
    ]) {
      expect(isNearBlackOrWhite(hex)).toBe(true);
    }
  });

  it("keeps real brand colours", () => {
    for (const hex of ["#2563eb", "#e54d26", "#ffd845", "#61dafb", "#a9bacd"]) {
      expect(isNearBlackOrWhite(hex)).toBe(false);
    }
  });

  it("ignores values it can't read", () => {
    expect(isNearBlackOrWhite("not a colour")).toBe(false);
  });
});

describe("skillIcon", () => {
  const none = { iconUrl: null };

  it("uses the single-colour plain glyph and the full-colour original", () => {
    expect(skillIcon({ ...none, iconSlug: "python" })).toEqual({
      kind: "devicon",
      mono: "python-plain",
      color: "python-original",
    });
  });

  it("uses the only variant for both when there is just one", () => {
    expect(skillIcon({ ...none, iconSlug: "react" })).toEqual({
      kind: "devicon",
      mono: "react-original",
      color: "react-original",
    });
  });

  it("never switches near-black logos to colour", () => {
    for (const iconSlug of ["nextjs", "linux", "express", "django"]) {
      const icon = skillIcon({ ...none, iconSlug });
      expect(icon).toMatchObject({ kind: "devicon", color: null });
    }
  });

  it("falls back to a wordmark when that is all there is", () => {
    expect(skillIcon({ ...none, iconSlug: "amazonwebservices" })).toMatchObject(
      {
        kind: "devicon",
        mono: "amazonwebservices-plain-wordmark",
      },
    );
  });

  it("falls back to the image URL for unknown slugs", () => {
    expect(
      skillIcon({ iconSlug: "no-such-icon", iconUrl: "https://x.test/a.svg" }),
    ).toEqual({ kind: "url", src: "https://x.test/a.svg" });
    expect(skillIcon({ iconSlug: "no-such-icon", iconUrl: null })).toBeNull();
  });

  it("refuses path tricks and non-web image URLs", () => {
    expect(skillIcon({ iconSlug: "../etc/passwd", iconUrl: null })).toBeNull();
    expect(skillIcon({ iconSlug: "python/../x", iconUrl: null })).toBeNull();
    expect(
      skillIcon({ iconSlug: null, iconUrl: "javascript:alert(1)" }),
    ).toBeNull();
  });

  it("returns null with nothing to show", () => {
    expect(skillIcon({ iconSlug: null, iconUrl: null })).toBeNull();
    expect(skillIcon({ iconSlug: "  ", iconUrl: "  " })).toBeNull();
  });

  it("resolves every slug in the dev seed to a file that exists", async () => {
    const { existsSync } = await import("node:fs");
    const { seedData } = await import("@/db/seed");
    for (const skill of seedData.skills) {
      const icon = skillIcon(skill);
      if (icon?.kind !== "devicon") continue;
      expect(existsSync(`public/devicon/${icon.mono}.svg`)).toBe(true);
      if (icon.color) {
        expect(existsSync(`public/devicon/${icon.color}.svg`)).toBe(true);
      }
    }
  });
});
