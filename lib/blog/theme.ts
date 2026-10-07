import { bundledThemes } from "shiki";

// Code colours (design.md §13.30): GitHub's light and dark themes, with the few
// colours that fall below 4.5:1 on our code frame (`surface` and
// `surface-raised`, both themes) replaced by the nearest colour that passes.
const REPLACEMENTS = {
  light: {
    "#6a737d": "#57606a", // comments
    "#22863a": "#1a7f37", // inserted
    "#d73a49": "#cf222e", // keywords
    "#e36209": "#bc4c00", // changed
  },
  dark: {
    "#6a737d": "#8b949e", // comments
  },
} as const;

type Theme = Awaited<
  ReturnType<(typeof bundledThemes)["github-light"]>
>["default"];

function recolour(value: unknown, map: Record<string, string>): unknown {
  if (typeof value === "string") return map[value.toLowerCase()] ?? value;
  if (Array.isArray(value)) return value.map((item) => recolour(item, map));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, recolour(item, map)]),
    );
  }
  return value;
}

async function load(mode: "light" | "dark"): Promise<Theme> {
  const source = (
    await bundledThemes[mode === "light" ? "github-light" : "github-dark"]()
  ).default;
  return {
    ...(recolour(source, REPLACEMENTS[mode]) as Theme),
    name: `chestly-${mode}`,
  };
}

export const codeThemes = async () => ({
  light: await load("light"),
  dark: await load("dark"),
});
