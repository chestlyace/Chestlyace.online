import { describe, expect, it } from "vitest";
import { adminConfig, toValues, validate, type AdminRow } from "./config";
import { RESOURCES } from "./resources";

describe("adminConfig", () => {
  it("exists for the five simple resources and no others yet", () => {
    for (const id of [
      "skills",
      "services",
      "certifications",
      "socials",
      "faq",
    ]) {
      expect(adminConfig(id)).toBeDefined();
    }
    for (const id of ["projects", "profile", "toString", "__proto__"]) {
      expect(adminConfig(id)).toBeUndefined();
    }
  });

  it("lists every schema field in the editor, and only those", () => {
    for (const id of [
      "skills",
      "services",
      "certifications",
      "socials",
      "faq",
    ]) {
      const config = adminConfig(id)!;
      const editor = config.groups
        .flatMap((g) => g.fields.map((f) => f.name))
        .sort();
      expect(editor).toEqual(Object.keys(config.schema.shape).sort());
      expect(Object.keys(config.defaults).sort()).toEqual(editor);
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
