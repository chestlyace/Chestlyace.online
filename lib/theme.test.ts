import { describe, expect, it } from "vitest";
import {
  THEME_COLORS,
  THEME_INIT_SCRIPT,
  nextThemePreference,
  parseThemePreference,
  themeCookieDomain,
  themeCookieValue,
} from "@/lib/theme";

describe("parseThemePreference", () => {
  it.each(["system", "light", "dark"] as const)("accepts %s", (value) => {
    expect(parseThemePreference(value)).toBe(value);
  });

  it.each([undefined, null, "", "blue", "toString"])(
    "falls back to system for %s",
    (value) => {
      expect(parseThemePreference(value)).toBe("system");
    },
  );
});

describe("nextThemePreference", () => {
  it("cycles system → light → dark → system", () => {
    expect(nextThemePreference("system")).toBe("light");
    expect(nextThemePreference("light")).toBe("dark");
    expect(nextThemePreference("dark")).toBe("system");
  });
});

describe("themeCookieDomain", () => {
  it.each([
    "chestlyace.online",
    "creatives.chestlyace.online",
    "blog.chestlyace.online",
  ])("shares the cookie across subdomains on %s", (host) => {
    expect(themeCookieDomain(host)).toBe(".chestlyace.online");
  });

  it.each([
    "localhost",
    "blog.localhost",
    "app.vercel.app",
    "notchestlyace.online",
  ])("keeps a host-only cookie on %s", (host) => {
    expect(themeCookieDomain(host)).toBeUndefined();
  });
});

describe("themeCookieValue", () => {
  it("reads the theme cookie among others", () => {
    expect(themeCookieValue("a=1; theme=dark; b=2")).toBe("dark");
    expect(themeCookieValue("theme=light")).toBe("light");
  });

  it("does not match cookies that merely end in 'theme'", () => {
    expect(themeCookieValue("othertheme=dark")).toBeUndefined();
  });
});

function runInitScript(cookie: string, systemDark: boolean) {
  const classes = new Set<string>();
  const meta = {
    content: "",
    setAttribute(_: string, v: string) {
      meta.content = v;
    },
  };
  const root = {
    classList: {
      toggle: (name: string, on: boolean) =>
        on ? classes.add(name) : classes.delete(name),
    },
    style: { colorScheme: "" },
  };
  const document = {
    cookie,
    documentElement: root,
    head: { appendChild() {} },
    querySelector: () => meta,
    createElement: () => meta,
  };
  const window = { matchMedia: () => ({ matches: systemDark }) };
  new Function("document", "window", THEME_INIT_SCRIPT)(document, window);
  return {
    dark: classes.has("dark"),
    colorScheme: root.style.colorScheme,
    themeColor: meta.content,
  };
}

describe("THEME_INIT_SCRIPT", () => {
  it("follows the system when there is no cookie", () => {
    expect(runInitScript("", true)).toEqual({
      dark: true,
      colorScheme: "dark",
      themeColor: THEME_COLORS.dark,
    });
    expect(runInitScript("", false)).toEqual({
      dark: false,
      colorScheme: "light",
      themeColor: THEME_COLORS.light,
    });
  });

  it("lets the cookie override the system", () => {
    expect(runInitScript("theme=light", true).dark).toBe(false);
    expect(runInitScript("x=1; theme=dark", false).dark).toBe(true);
  });

  it("treats theme=system like no cookie", () => {
    expect(runInitScript("theme=system", true).dark).toBe(true);
  });

  it("ignores unknown values", () => {
    expect(runInitScript("theme=blue", false).dark).toBe(false);
  });
});
