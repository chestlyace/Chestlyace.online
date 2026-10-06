import { describe, expect, it } from "vitest";
import { clientIp, isSameOrigin, safeNext } from "./request";

describe("safeNext", () => {
  it("keeps paths on the admin host", () => {
    expect(safeNext("/projects/3")).toBe("/projects/3");
    expect(safeNext("/skills?x=1")).toBe("/skills?x=1");
  });

  it.each([
    null,
    undefined,
    "",
    "projects",
    "//evil.example",
    "/\\evil.example",
    "https://evil.example",
    "javascript:alert(1)",
    "/a\nb",
    "/login",
    "/login?next=/x",
  ])("sends %j to the dashboard", (value) => {
    expect(safeNext(value)).toBe("/");
  });
});

describe("isSameOrigin", () => {
  const request = (headers: Record<string, string>) =>
    new Request("https://admin.example/api/auth/login", {
      method: "POST",
      headers,
    });

  it("passes requests with no Origin, or with this site's", () => {
    expect(isSameOrigin(request({}))).toBe(true);
    expect(isSameOrigin(request({ origin: "https://admin.example" }))).toBe(
      true,
    );
  });

  it("refuses another site's", () => {
    expect(isSameOrigin(request({ origin: "https://evil.example" }))).toBe(
      false,
    );
    expect(isSameOrigin(request({ origin: "not a url" }))).toBe(false);
  });
});

describe("clientIp", () => {
  it("takes the first forwarded address", () => {
    expect(
      clientIp(
        new Request("https://x.test", {
          headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
        }),
      ),
    ).toBe("1.2.3.4");
    expect(clientIp(new Request("https://x.test"))).toBe("unknown");
  });
});
