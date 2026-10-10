import { describe, expect, it } from "vitest";
import { inLanguage, writtenIn } from "./localizePost";

const row = (extra: Record<string, unknown> = {}) => ({
  slug: "hello",
  title: "Hello",
  description: "About hello",
  coverAlt: "A cover",
  readingMinutes: 3,
  series: null as string | null,
  fr: { title: "Bonjour", description: "  ", coverAlt: "Une couverture" },
  frenchLive: true,
  readingMinutesFr: 5,
  ...extra,
});

describe("inLanguage", () => {
  it("is the English text, without the French columns", () => {
    const result = inLanguage(row(), "en");
    expect(result).toEqual({
      slug: "hello",
      title: "Hello",
      description: "About hello",
      coverAlt: "A cover",
      readingMinutes: 3,
      series: null,
      lang: "en",
    });
  });

  it("is French when the post has a live French version", () => {
    const result = inLanguage(row(), "fr");
    expect(result.lang).toBe("fr");
    expect(result.title).toBe("Bonjour");
    expect(result.coverAlt).toBe("Une couverture");
    expect(result.description).toBe("About hello"); // blank falls back
    expect(result.readingMinutes).toBe(5);
    expect(result).not.toHaveProperty("translations");
    expect(result).not.toHaveProperty("fr");
  });

  it("stays English on the French blog without a live French version", () => {
    const result = inLanguage(row({ frenchLive: false }), "fr");
    expect(result.lang).toBe("en");
    expect(result.title).toBe("Hello");
    expect(result.readingMinutes).toBe(3);
  });
});

describe("writtenIn", () => {
  it("keeps the posts written in the language", () => {
    const posts = [
      { slug: "a", lang: "fr" as const },
      { slug: "b", lang: "en" as const },
    ];
    expect(writtenIn(posts, "fr").map((p) => p.slug)).toEqual(["a"]);
    expect(writtenIn(posts, "en").map((p) => p.slug)).toEqual(["b"]);
  });
});
