import { describe, expect, it } from "vitest";
import { CREATIVES_NAV, creativesActiveLink } from "./nav";

describe("creatives navigation", () => {
  it("lists Work, Design, Photography and Services", () => {
    expect(CREATIVES_NAV.map((link) => link.label)).toEqual([
      "Work",
      "Design",
      "Photography",
      "Services",
    ]);
  });

  it("marks the link of the route, with Work on the home page only", () => {
    expect(creativesActiveLink("/")).toBe("work");
    expect(creativesActiveLink("/design")).toBe("design");
    expect(creativesActiveLink("/photography/pycon")).toBe("photography");
    expect(creativesActiveLink("/services")).toBe("services");
    expect(creativesActiveLink("/nowhere")).toBeNull();
  });
});
