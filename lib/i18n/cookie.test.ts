import { describe, expect, it } from "vitest";
import { stripSitePrefix, switchPath } from "./index";
import {
  cookieDomain,
  langCookie,
  prefersFrench,
  readLangCookie,
} from "./cookie";

describe("the lang cookie", () => {
  it("is shared across the sites of a domain, and per host on localhost and IPs", () => {
    expect(cookieDomain("blog.chestlyace.online")).toBe(".chestlyace.online");
    expect(cookieDomain("chestlyace.online")).toBeUndefined();
    expect(cookieDomain("creatives.localhost:3100")).toBeUndefined();
    expect(cookieDomain("localhost")).toBeUndefined();
    expect(cookieDomain("127.0.0.1")).toBeUndefined();
    expect(langCookie("fr", "blog.chestlyace.online")).toBe(
      "lang=fr; path=/; max-age=31536000; samesite=lax; domain=.chestlyace.online",
    );
    expect(langCookie("en", "localhost")).toBe(
      "lang=en; path=/; max-age=31536000; samesite=lax",
    );
  });

  it("reads only a valid value of its own cookie", () => {
    expect(readLangCookie("a=1; lang=fr; b=2")).toBe("fr");
    expect(readLangCookie("lang=en")).toBe("en");
    expect(readLangCookie("lang=de")).toBeNull();
    expect(readLangCookie("xlang=fr")).toBeNull();
    expect(readLangCookie("")).toBeNull();
  });
});

describe("prefersFrench", () => {
  it("looks at the first language only", () => {
    expect(prefersFrench(["fr"])).toBe(true);
    expect(prefersFrench(["fr-CA", "en"])).toBe(true);
    expect(prefersFrench(["en-US", "fr"])).toBe(false);
    expect(prefersFrench(["frequent"])).toBe(false);
    expect(prefersFrench([])).toBe(false);
    expect(prefersFrench(undefined)).toBe(false);
  });
});

describe("the switcher's path", () => {
  it("works from the internal path a static page may still report", () => {
    expect(stripSitePrefix("/sites/blog/en/post")).toBe("/en/post");
    expect(stripSitePrefix("/sites/main/fr")).toBe("/fr");
    expect(stripSitePrefix("/sites/main")).toBe("/");
    expect(stripSitePrefix("/projects/x")).toBe("/projects/x");
    expect(switchPath(stripSitePrefix("/sites/blog/en/post"), "fr")).toBe(
      "/fr/post",
    );
    expect(switchPath(stripSitePrefix("/sites/main/fr"), "en")).toBe("/");
    expect(switchPath(stripSitePrefix("/fr/design"), "en")).toBe("/design");
  });
});
