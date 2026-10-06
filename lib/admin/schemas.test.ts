import { describe, expect, it } from "vitest";
import {
  certificationSchema,
  faqSchema,
  fieldErrors,
  reorderSchema,
  serviceSchema,
  skillSchema,
  socialSchema,
} from "./schemas";
import { SERVICE_ICONS } from "./serviceIcons";

describe("serviceIcons", () => {
  it("are all real Iconly icons", async () => {
    const iconly = await import("react-iconly");
    for (const name of SERVICE_ICONS)
      expect(Object.hasOwn(iconly, name)).toBe(true);
  });
});

describe("skillSchema", () => {
  const ok = {
    name: " React ",
    category: "framework",
    iconSlug: "react",
    iconUrl: "",
    isPublished: true,
  };

  it("trims, and turns blanks into null", () => {
    expect(skillSchema.parse(ok)).toEqual({
      ...ok,
      name: "React",
      iconUrl: null,
    });
    expect(skillSchema.parse({ ...ok, iconSlug: "  " }).iconSlug).toBeNull();
  });

  it("refuses unknown fields, bad categories and bad slugs", () => {
    expect(skillSchema.safeParse({ ...ok, order_index: 3 }).success).toBe(
      false,
    );
    expect(skillSchema.safeParse({ ...ok, category: "other" }).success).toBe(
      false,
    );
    expect(
      skillSchema.safeParse({ ...ok, iconSlug: "React Native" }).success,
    ).toBe(false);
    expect(skillSchema.safeParse({ ...ok, name: "x".repeat(61) }).success).toBe(
      false,
    );
  });

  it("accepts an image address or a path on this site, nothing else", () => {
    expect(
      skillSchema.safeParse({ ...ok, iconUrl: "https://x.test/a.svg" }).success,
    ).toBe(true);
    expect(
      skillSchema.safeParse({ ...ok, iconUrl: "/devicon/react.svg" }).success,
    ).toBe(true);
    for (const bad of [
      "javascript:alert(1)",
      "//evil.test/a.png",
      "/../etc/passwd",
      "ftp://x.test/a.png",
      "data:image/png;base64,AAA",
    ]) {
      expect(skillSchema.safeParse({ ...ok, iconUrl: bad }).success).toBe(
        false,
      );
    }
  });
});

describe("serviceSchema", () => {
  const ok = {
    title: "Web",
    description: "Sites.",
    icon: "Category",
    items: ["A", "B"],
    isPublished: false,
  };

  it("checks the icon, the items and the lengths", () => {
    expect(serviceSchema.safeParse(ok).success).toBe(true);
    expect(serviceSchema.safeParse({ ...ok, icon: "Nope" }).success).toBe(
      false,
    );
    expect(
      serviceSchema.safeParse({
        ...ok,
        items: Array(9)
          .fill("x")
          .map((x, i) => x + i),
      }).success,
    ).toBe(false);
    expect(serviceSchema.safeParse({ ...ok, items: ["a", "A"] }).success).toBe(
      false,
    );
    expect(
      serviceSchema.safeParse({ ...ok, description: "x".repeat(401) }).success,
    ).toBe(false);
  });
});

describe("certificationSchema", () => {
  const ok = {
    name: "Cert",
    issuer: "Google",
    issuedOn: "",
    badgeUrl: "/certs/a.png",
    credentialUrl: null,
    isPublished: true,
  };

  it("takes an optional real date and links", () => {
    expect(certificationSchema.parse(ok).issuedOn).toBeNull();
    expect(
      certificationSchema.parse({ ...ok, issuedOn: "2025-03-01" }).issuedOn,
    ).toBe("2025-03-01");
    expect(
      certificationSchema.safeParse({ ...ok, issuedOn: "2025-13-45" }).success,
    ).toBe(false);
    expect(
      certificationSchema.safeParse({ ...ok, issuedOn: "last year" }).success,
    ).toBe(false);
    expect(
      certificationSchema.safeParse({ ...ok, credentialUrl: "not a url" })
        .success,
    ).toBe(false);
  });
});

describe("socialSchema", () => {
  const ok = {
    platform: "GitHub",
    url: "https://github.com/x",
    icon: "github",
    showOn: ["main", "blog"],
  };

  it("needs a web address and at least one site", () => {
    expect(socialSchema.safeParse(ok).success).toBe(true);
    expect(socialSchema.safeParse({ ...ok, url: "github.com/x" }).success).toBe(
      false,
    );
    expect(socialSchema.safeParse({ ...ok, showOn: [] }).success).toBe(false);
    expect(
      socialSchema.safeParse({ ...ok, showOn: ["main", "main"] }).success,
    ).toBe(false);
    expect(socialSchema.safeParse({ ...ok, showOn: ["admin"] }).success).toBe(
      false,
    );
  });
});

describe("faqSchema and reorderSchema", () => {
  it("check their fields", () => {
    expect(
      faqSchema.safeParse({ question: "Q?", answer: "A.", isPublished: true })
        .success,
    ).toBe(true);
    expect(
      faqSchema.safeParse({ question: "", answer: "A.", isPublished: true })
        .success,
    ).toBe(false);
    expect(reorderSchema.safeParse({ ids: [3, 1, 2] }).success).toBe(true);
    expect(reorderSchema.safeParse({ ids: [1, 1] }).success).toBe(false);
    expect(reorderSchema.safeParse({ ids: [] }).success).toBe(false);
    expect(reorderSchema.safeParse({ ids: ["1"] }).success).toBe(false);
  });
});

describe("fieldErrors", () => {
  it("gives the first message per field", () => {
    const result = skillSchema.safeParse({
      name: "",
      category: "x",
      isPublished: true,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = fieldErrors(result.error);
      expect(fields.name).toBe("Enter the name.");
      expect(fields.category).toBe("Choose a category.");
    }
  });
});
