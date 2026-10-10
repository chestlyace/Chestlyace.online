import { describe, expect, it } from "vitest";
import { getMessages } from "@/content/messages";
import { en } from "@/content/messages/en";
import { fr } from "@/content/messages/fr";
import { format, plural } from "./format";
import {
  DEFAULT_LANG,
  LANGS,
  isLang,
  langOfPath,
  localizedPath,
  splitLang,
  switchPath,
} from "./index";
import { localize, localizeSiblings } from "./localize";

describe("languages", () => {
  it("are English (the default) and French", () => {
    expect(LANGS).toEqual(["en", "fr"]);
    expect(DEFAULT_LANG).toBe("en");
    expect(isLang("fr")).toBe(true);
    expect(isLang("de")).toBe(false);
    expect(isLang(undefined)).toBe(false);
  });
});

describe("addresses", () => {
  it("splits the language from a public path", () => {
    expect(splitLang("/fr/design")).toEqual({ lang: "fr", rest: "/design" });
    expect(splitLang("/fr")).toEqual({ lang: "fr", rest: "/" });
    expect(splitLang("/fr/")).toEqual({ lang: "fr", rest: "/" });
    expect(splitLang("/design")).toEqual({ lang: null, rest: "/design" });
    expect(splitLang("/")).toEqual({ lang: null, rest: "/" });
    expect(splitLang("/frequently")).toEqual({
      lang: null,
      rest: "/frequently",
    });
  });

  it("builds the address of a path in a language", () => {
    expect(localizedPath("/design", "fr")).toBe("/fr/design");
    expect(localizedPath("/", "fr")).toBe("/fr");
    expect(localizedPath("/design", "en")).toBe("/design");
    expect(localizedPath("/fr/design", "en")).toBe("/design");
    expect(localizedPath("/fr/design", "fr")).toBe("/fr/design");
  });

  it("switches a page to the other language and back", () => {
    expect(switchPath("/projects/x", "fr")).toBe("/fr/projects/x");
    expect(switchPath("/fr/projects/x", "en")).toBe("/projects/x");
    expect(switchPath("/fr", "en")).toBe("/");
    expect(switchPath(switchPath("/a/b", "fr"), "en")).toBe("/a/b");
    expect(langOfPath("/fr/a")).toBe("fr");
    expect(langOfPath("/a")).toBe("en");
  });
});

describe("localize", () => {
  const row = {
    title: "Hello",
    summary: "Short",
    tags: ["a"],
    translations: { fr: { title: "Bonjour", summary: "  ", tags: ["b", "c"] } },
  };

  it("leaves English alone", () => {
    expect(localize(row, "en", ["title"])).toBe(row);
  });

  it("applies the French that is there and keeps the English that is not", () => {
    const result = localize(row, "fr", ["title", "summary", "tags"]);
    expect(result.title).toBe("Bonjour");
    expect(result.summary).toBe("Short"); // blank French falls back
    expect(result.tags).toEqual(["b", "c"]);
  });

  it("only touches the fields it is given", () => {
    expect(localize(row, "fr", ["summary"]).title).toBe("Hello");
  });

  it("returns the row when there is no translation at all", () => {
    const bare = { title: "Hello", translations: null };
    expect(localize(bare, "fr", ["title"])).toBe(bare);
    const empty = { title: "Hello" };
    expect(localize(empty, "fr", ["title"])).toBe(empty);
  });

  it("applies the French sibling keys of list items", () => {
    const images = [
      { url: "a", alt: "A", altFr: "Un" },
      { url: "b", alt: "B", altFr: "" },
      { url: "c", alt: "C" },
    ];
    expect(localizeSiblings(images, "fr", ["alt"]).map((i) => i.alt)).toEqual([
      "Un",
      "B",
      "C",
    ]);
    expect(localizeSiblings(images, "en", ["alt"]).map((i) => i.alt)).toEqual([
      "A",
      "B",
      "C",
    ]);
  });
});

describe("messages", () => {
  const keys = (value: unknown, prefix = ""): string[] =>
    value && typeof value === "object"
      ? Object.entries(value).flatMap(([k, v]) => keys(v, `${prefix}${k}.`))
      : [prefix.slice(0, -1)];
  const leaves = (value: unknown): [string, string][] =>
    keys(value).map((key) => [
      key,
      key
        .split(".")
        .reduce<unknown>(
          (o, k) => (o as Record<string, unknown>)[k],
          value,
        ) as string,
    ]);
  const placeholders = (text: string) =>
    [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

  it("has the same keys in French as in English", () => {
    expect(keys(fr).sort()).toEqual(keys(en).sort());
  });

  it("has no empty French text and the same placeholders", () => {
    const english = new Map(leaves(en));
    for (const [key, text] of leaves(fr)) {
      expect(text.trim(), key).not.toBe("");
      expect(placeholders(text), key).toEqual(
        placeholders(english.get(key) ?? ""),
      );
    }
  });

  it("gives each language its dictionary", () => {
    expect(getMessages("en")).toBe(en);
    expect(getMessages("fr")).toBe(fr);
  });
});

describe("format and plural", () => {
  it("fills placeholders and leaves unknown ones", () => {
    expect(format("Hi {name}, {n} new", { name: "Ada", n: 3 })).toBe(
      "Hi Ada, 3 new",
    );
    expect(format("Hi {name}")).toBe("Hi {name}");
    expect(format("no placeholders")).toBe("no placeholders");
  });

  it("chooses the plural form of a language", () => {
    const forms = { one: "{count} message", other: "{count} messages" };
    expect(plural(forms, 1, "en")).toBe("1 message");
    expect(plural(forms, 2, "en")).toBe("2 messages");
    // French counts 0 and 1 as singular.
    const fr = { one: "{count} message", other: "{count} messages" };
    expect(plural(fr, 0, "fr")).toBe("0 message");
    expect(plural(fr, 2, "fr")).toBe("2 messages");
  });
});
