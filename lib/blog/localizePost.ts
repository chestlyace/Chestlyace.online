import { localize } from "@/lib/i18n/localize";
import type { Lang } from "@/lib/i18n";

// A blog post in a language (docs/i18n.md §5). The French version is optional: a post
// is *in French* when `translations.fr.content` is set AND `translations.fr.published`
// is true (so a French draft can wait). Any other post is read in English, field by
// field it never mixes the two languages' text. Pure.

/** The extra columns the reads select beside a post's English ones. */
export type FrenchColumns = {
  /** `translations.fr` without its (large) `content`, or null. */
  fr: Record<string, unknown> | null;
  /** Whether the post has a published French version. */
  frenchLive: boolean;
  /** The reading time of the French text. */
  readingMinutesFr: number;
};

type Base = { readingMinutes: number };

const FIELDS = ["title", "description", "coverAlt", "series"];

type Result<T> = Omit<T, keyof FrenchColumns> & {
  lang: Lang;
  /** Whether the post has a published French version (in either language). */
  hasFrench: boolean;
};

/**
 * The post as `lang` reads it, and the language its text is in (`lang`): French only
 * when `lang` is French and the post has a published French version, English otherwise.
 */
export function inLanguage<T extends Base & FrenchColumns>(
  row: T,
  lang: Lang,
): Result<T> {
  const { fr, frenchLive, readingMinutesFr, ...rest } = row;
  const base = rest as unknown as Record<string, unknown> & Base;
  if (lang === "fr" && frenchLive) {
    const withFrench: Record<string, unknown> = {
      ...base,
      translations: { fr: fr ?? {} },
    };
    const { translations, ...text } = localize(withFrench, "fr", FIELDS);
    void translations;
    return {
      ...text,
      readingMinutes: readingMinutesFr,
      lang: "fr",
      hasFrench: true,
    } as unknown as Result<T>;
  }
  return { ...base, lang: "en", hasFrench: frenchLive } as unknown as Result<T>;
}

/** The posts that are written in `lang` (the French feed, tags and sitemap). */
export function writtenIn<T extends { lang: Lang }>(
  posts: readonly T[],
  lang: Lang,
): T[] {
  return posts.filter((post) => post.lang === lang);
}
