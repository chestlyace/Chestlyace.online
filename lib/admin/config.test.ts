import { describe, expect, it } from "vitest";
import { adminConfig, toValues, validate, type AdminRow } from "./config";
import { RESOURCES } from "./resources";

describe("adminConfig", () => {
  it("exists for the five simple resources and no others yet", () => {
    for (const { id } of RESOURCES) {
      const config = adminConfig(id)!;
      const editor = config.groups
        .flatMap((g) => g.fields.map((f) => f.name))
        .sort();
      expect(editor).toEqual(Object.keys(config.schema.shape).sort());
      // the profile's values come from its row; the others start from defaults
      if (!config.single) {
        expect(Object.keys(config.defaults).sort()).toEqual(editor);
      }
      expect(RESOURCES.some((r) => r.id === id)).toBe(true);
    }
  });
});

describe("row text", () => {
  it("follows design.md §14.11", () => {
    expect(
      adminConfig("skills")!.row({
        id: 1,
        name: "React",
        category: "framework",
        iconSlug: "react",
      }),
    ).toEqual({ title: "React", subtitle: "Framework · react" });
    expect(
      adminConfig("skills")!.row({
        id: 1,
        name: "AWS",
        category: "cloud",
        iconSlug: null,
        iconUrl: "https://x",
      }).subtitle,
    ).toBe("Cloud & DevOps · image");
    expect(
      adminConfig("services")!.row({
        id: 1,
        title: "Web",
        icon: "Category",
        items: ["a", "b"],
      }).subtitle,
    ).toBe("2 items · icon Category");
    expect(
      adminConfig("certifications")!.row({
        id: 1,
        name: "C",
        issuer: "Google",
        issuedOn: null,
      }).subtitle,
    ).toBe("Google · no date");
    expect(
      adminConfig("faq")!.row({
        id: 1,
        question: "Q?",
        answer: "First line\nSecond",
      }).subtitle,
    ).toBe("First line");
  });
});

describe("toValues and validate", () => {
  const config = adminConfig("certifications")!;
  const row: AdminRow = {
    id: 1,
    name: "N",
    issuer: "I",
    issuedOn: null,
    badgeUrl: "/certs/a.png",
    credentialUrl: null,
    isPublished: true,
    orderIndex: 3,
  };

  it("makes form values from a row, with blanks for missing", () => {
    expect(toValues(config, row)).toEqual({
      isPublished: true,
      name: "N",
      issuer: "I",
      issuedOn: "",
      badgeUrl: "/certs/a.png",
      credentialUrl: "",
    });
  });

  it("finds the problems in a form, one message per field", () => {
    expect(validate(config, toValues(config, row))).toEqual({});
    const errors = validate(config, {
      ...toValues(config, row),
      name: "",
      credentialUrl: "nope",
    });
    expect(Object.keys(errors).sort()).toEqual(["credentialUrl", "name"]);
  });
});

describe("the new row texts", () => {
  it("follow design.md §14.11", () => {
    expect(
      adminConfig("projects")!.row({
        id: 1,
        title: "Alexdy",
        categoryLabel: "Full Stack",
        techStack: ["a", "b"],
        isFeatured: true,
      }),
    ).toEqual({ title: "Alexdy", subtitle: "Full Stack · 2 tech · Featured" });
    expect(
      adminConfig("experience")!.row({
        id: 1,
        role: "Dev",
        organization: "Acme",
        type: "education",
        startDate: "2023-01-01",
        endDate: "2025-01-01",
        datesLabel: null,
      }).subtitle,
    ).toBe("Acme · 2023 — 2025 · Education");
    expect(
      adminConfig("volunteering")!.row({
        id: 1,
        role: "Mentor",
        organization: "Club",
        datesLabel: "2024",
        startDate: null,
        endDate: null,
      }).subtitle,
    ).toBe("Club · 2024");
    expect(adminConfig("experience")!.tabs?.options.map(([v]) => v)).toEqual([
      "all",
      "work",
      "education",
    ]);
  });
});
