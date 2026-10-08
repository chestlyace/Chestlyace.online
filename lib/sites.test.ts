import { describe, expect, it, vi } from "vitest";
import { decideRoute, siteFromHost, type RoutingInput } from "@/lib/sites";

describe("siteFromHost", () => {
  it.each([
    ["chestlyace.online", "main"],
    ["creatives.chestlyace.online", "creatives"],
    ["blog.chestlyace.online", "blog"],
    ["admin.chestlyace.online", "admin"],
    ["admin.localhost:3000", "admin"],
    ["localhost:3000", "main"],
    ["creatives.localhost:3000", "creatives"],
    ["blog.localhost:4000", "blog"],
    ["BLOG.Chestlyace.Online", "blog"],
  ])("%s → %s", (host, site) => {
    expect(siteFromHost(host)).toBe(site);
  });

  it.each([null, undefined, "", "example.com", "my-app-git-branch.vercel.app"])(
    "unknown host %s → main",
    (host) => {
      expect(siteFromHost(host)).toBe("main");
    },
  );
});

describe("decideRoute", () => {
  const base: RoutingInput = {
    host: "chestlyace.online",
    pathname: "/",
    siteParam: null,
    siteCookie: undefined,
    allowOverride: false,
  };

  it("rewrites the root of each host to its site folder", () => {
    expect(decideRoute(base)).toEqual({
      kind: "rewrite",
      site: "main",
      pathname: "/sites/main",
    });
    expect(
      decideRoute({ ...base, host: "blog.chestlyace.online" }),
    ).toMatchObject({
      kind: "rewrite",
      pathname: "/sites/blog",
    });
  });

  it("keeps the rest of the path", () => {
    expect(
      decideRoute({
        ...base,
        host: "creatives.chestlyace.online",
        pathname: "/a/b",
      }),
    ).toMatchObject({ pathname: "/sites/creatives/a/b" });
  });

  it("cannot reach another site's folder by path", () => {
    expect(decideRoute({ ...base, pathname: "/sites/blog" })).toMatchObject({
      pathname: "/sites/main/sites/blog",
    });
  });

  it.each(["/api", "/api/x", "/api/contact", "/api/portfolio"])(
    "returns 404 for %s on creatives, blog and admin",
    (pathname) => {
      for (const host of [
        "creatives.chestlyace.online",
        "blog.chestlyace.online",
        "admin.chestlyace.online",
      ]) {
        expect(decideRoute({ ...base, host, pathname })).toEqual({
          kind: "not-found",
        });
      }
    },
  );

  it.each(["/api/auth/login", "/api/auth/logout", "/api/admin/skills"])(
    "serves %s on the admin host only",
    (pathname) => {
      expect(
        decideRoute({ ...base, host: "admin.chestlyace.online", pathname }),
      ).toEqual({ kind: "pass-through", site: "admin" });
      for (const host of [
        "chestlyace.online",
        "creatives.chestlyace.online",
        "blog.chestlyace.online",
      ]) {
        expect(decideRoute({ ...base, host, pathname })).toEqual({
          kind: "not-found",
        });
      }
    },
  );

  it("serves /api/blog on the blog host only", () => {
    const pathname = "/api/blog/posts/hello/like";
    expect(
      decideRoute({ ...base, host: "blog.chestlyace.online", pathname }),
    ).toEqual({ kind: "pass-through", site: "blog" });
    for (const host of [
      "chestlyace.online",
      "creatives.chestlyace.online",
      "admin.chestlyace.online",
    ]) {
      expect(decideRoute({ ...base, host, pathname })).toEqual({
        kind: "not-found",
      });
    }
  });

  it("serves /api/revalidate on every host", () => {
    for (const host of [
      "chestlyace.online",
      "creatives.chestlyace.online",
      "admin.chestlyace.online",
    ]) {
      expect(
        decideRoute({ ...base, host, pathname: "/api/revalidate" }),
      ).toMatchObject({ kind: "pass-through" });
    }
  });

  it("keeps the admin's pages on the admin host", () => {
    expect(
      decideRoute({
        ...base,
        host: "admin.chestlyace.online",
        pathname: "/login",
      }),
    ).toEqual({
      kind: "rewrite",
      site: "admin",
      pathname: "/sites/admin/login",
    });
    expect(
      decideRoute({ ...base, host: "admin.chestlyace.online" }),
    ).toMatchObject({ pathname: "/sites/admin" });
  });

  it("passes /api through untouched on main", () => {
    expect(decideRoute({ ...base, pathname: "/api/portfolio" })).toEqual({
      kind: "pass-through",
      site: "main",
    });
  });

  it("sends /admin on main to the admin host (the old panel's address)", () => {
    expect(decideRoute({ ...base, pathname: "/admin" })).toEqual({
      kind: "redirect",
      location: "https://admin.chestlyace.online/",
    });
  });

  it("does not treat /administrator as /admin", () => {
    expect(
      decideRoute({
        ...base,
        host: "blog.chestlyace.online",
        pathname: "/administrator",
      }),
    ).toMatchObject({ kind: "rewrite", pathname: "/sites/blog/administrator" });
  });

  describe("preview override", () => {
    const preview = { ...base, host: "x.vercel.app", allowOverride: true };

    it("uses ?site= and asks for the cookie to be set", () => {
      expect(decideRoute({ ...preview, siteParam: "blog" })).toEqual({
        kind: "rewrite",
        site: "blog",
        pathname: "/sites/blog",
        setPreviewCookie: "blog",
      });
    });

    it("falls back to the cookie", () => {
      expect(
        decideRoute({ ...preview, siteCookie: "creatives" }),
      ).toMatchObject({
        site: "creatives",
        setPreviewCookie: undefined,
      });
    });

    it("lets ?site= replace the cookie", () => {
      expect(
        decideRoute({ ...preview, siteParam: "main", siteCookie: "blog" }),
      ).toMatchObject({ site: "main", setPreviewCookie: "main" });
    });

    it.each(["toString", "constructor", "__proto__", "hasOwnProperty"])(
      "ignores inherited property name %s",
      (value) => {
        expect(
          decideRoute({ ...preview, siteParam: value, siteCookie: value }),
        ).toMatchObject({ site: "main", setPreviewCookie: undefined });
      },
    );

    it("ignores invalid values", () => {
      expect(
        decideRoute({ ...preview, siteParam: "nope", siteCookie: "nope" }),
      ).toMatchObject({ site: "main" });
    });

    it("can preview the admin", () => {
      expect(decideRoute({ ...preview, siteParam: "admin" })).toMatchObject({
        site: "admin",
        pathname: "/sites/admin",
      });
    });

    it("applies each API route's host rule to the overridden site", () => {
      expect(
        decideRoute({
          ...preview,
          siteParam: "blog",
          pathname: "/api/contact",
        }),
      ).toEqual({ kind: "not-found" });
      expect(
        decideRoute({
          ...preview,
          siteParam: "admin",
          pathname: "/api/auth/login",
        }),
      ).toEqual({ kind: "pass-through", site: "admin" });
    });
  });

  it("ignores ?site= and the cookie in production", () => {
    expect(
      decideRoute({ ...base, siteParam: "blog", siteCookie: "creatives" }),
    ).toMatchObject({ site: "main", setPreviewCookie: undefined });
  });
});

describe("siteUrl", () => {
  it("uses production hosts by default", async () => {
    const { siteUrl } = await import("@/lib/sites");
    expect(siteUrl("blog", "/hello")).toBe(
      "https://blog.chestlyace.online/hello",
    );
    expect(siteUrl("main")).toBe("https://chestlyace.online/");
  });

  it("uses NEXT_PUBLIC_*_URL overrides", async () => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_CREATIVES_URL", "https://preview.example.com");
    const { siteUrl } = await import("@/lib/sites");
    expect(siteUrl("creatives", "/work")).toBe(
      "https://preview.example.com/work",
    );
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("stays on the branch URL with ?site= on Vercel previews", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("VERCEL_BRANCH_URL", "app-git-feature-me.vercel.app");
    const { siteUrl } = await import("@/lib/sites");
    expect(siteUrl("blog")).toBe(
      "https://app-git-feature-me.vercel.app/?site=blog",
    );
    expect(siteUrl("creatives", "/work")).toBe(
      "https://app-git-feature-me.vercel.app/work?site=creatives",
    );
    vi.unstubAllEnvs();
  });

  it("ignores the branch URL outside previews", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("VERCEL_BRANCH_URL", "app-git-main-me.vercel.app");
    const { siteUrl } = await import("@/lib/sites");
    expect(siteUrl("blog")).toBe("https://blog.chestlyace.online/");
    vi.unstubAllEnvs();
  });
});

describe("old addresses (ia-content.md §6)", () => {
  const base: RoutingInput = {
    host: "chestlyace.online",
    pathname: "/",
    siteParam: null,
    siteCookie: undefined,
    allowOverride: false,
  };
  const at = (pathname: string, host = "chestlyace.online") =>
    decideRoute({ ...base, host, pathname });

  it.each([
    ["/software-development.html", "https://chestlyace.online/#services"],
    ["/software-development.html/", "https://chestlyace.online/#services"],
    ["/graphic-design.html", "https://creatives.chestlyace.online/services"],
    ["/photography.html", "https://creatives.chestlyace.online/services"],
    ["/admin", "https://admin.chestlyace.online/"],
    ["/admin/", "https://admin.chestlyace.online/"],
    ["/admin/index.html", "https://admin.chestlyace.online/"],
  ])("%s goes to %s", (pathname, location) => {
    expect(at(pathname)).toEqual({ kind: "redirect", location });
  });

  it("only redirects on the main host", () => {
    for (const host of [
      "creatives.chestlyace.online",
      "blog.chestlyace.online",
      "admin.chestlyace.online",
    ]) {
      expect(at("/admin", host).kind).toBe("rewrite");
      expect(at("/photography.html", host).kind).toBe("rewrite");
    }
  });

  it("leaves lookalikes alone", () => {
    expect(at("/administrators").kind).toBe("rewrite");
    expect(at("/projects/admin").kind).toBe("rewrite");
    expect(at("/software-development").kind).toBe("rewrite");
  });

  it("sends www to the main address, keeping the path and query", () => {
    expect(
      decideRoute({
        ...base,
        host: "www.chestlyace.online",
        pathname: "/projects/alexdy",
        search: "?utm_source=x",
      }),
    ).toEqual({
      kind: "redirect",
      location: "https://chestlyace.online/projects/alexdy?utm_source=x",
    });
    expect(decideRoute({ ...base, host: "www.chestlyace.online" })).toEqual({
      kind: "redirect",
      location: "https://chestlyace.online/",
    });
  });

  it("follows the preview override when asked for another site", () => {
    expect(
      decideRoute({
        ...base,
        host: "x.vercel.app",
        pathname: "/admin",
        siteParam: "creatives",
        allowOverride: true,
      }).kind,
    ).toBe("rewrite");
  });
});
