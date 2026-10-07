import { codeToTokens, type BundledLanguage } from "shiki";
import { codeThemes } from "./theme";

// Highlighted code as plain data for the client components (typewriter, code
// group, diff): lines of tokens, each with the two themes' colours as CSS
// variables, which the `.shiki` rules in globals.css switch between.
export type Token = { text: string; style: Record<string, string> };

const NAME_CLEAN = /[^\w-]/g;

export async function tokenize(code: string, lang: string): Promise<Token[][]> {
  const themes = await codeThemes();
  const run = (language: string) =>
    codeToTokens(code, {
      lang: language as BundledLanguage,
      themes,
      defaultColor: false,
    });
  let result;
  try {
    result = await run(lang.replace(NAME_CLEAN, "") || "text");
  } catch {
    // A language the bundle doesn't know shows as plain text.
    result = await run("text");
  }
  return result.tokens.map((line) =>
    line.map((token) => ({
      text: token.content,
      style: Object.fromEntries(
        Object.entries(token.htmlStyle ?? {}).map(([key, value]) => [
          key,
          String(value),
        ]),
      ),
    })),
  );
}
